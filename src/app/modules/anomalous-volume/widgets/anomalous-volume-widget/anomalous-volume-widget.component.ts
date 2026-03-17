import { Component, OnInit, inject, input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { WidgetInstance } from '../../../../shared/models/dashboard/dashboard-item.model';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { getValueOrDefault } from '../../../../shared/utils/object-helper';
import { WidgetSkeletonComponent } from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import { WidgetHeaderComponent } from '../../../../shared/components/widget-header/widget-header.component';
import { AnomalousVolumeComponent } from '../../components/anomalous-volume/anomalous-volume.component';
import { AnomalousVolumeSettingsComponent } from '../../components/anomalous-volume-settings/anomalous-volume-settings.component';
import {
  AnomalousVolumeSourceMode,
  AnomalousVolumeSettings,
  anomalousVolumeWidgetColumns
} from '../../models/anomalous-volume-settings.model';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { PositionsService } from '../../../../shared/services/positions.service';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { Position } from '../../../../shared/models/positions/position.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { QuotesService } from '../../../../shared/services/quotes.service';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';

@Component({
  selector: 'ats-anomalous-volume-widget',
  templateUrl: './anomalous-volume-widget.component.html',
  styleUrl: './anomalous-volume-widget.component.less',
  imports: [
    AsyncPipe,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    AnomalousVolumeComponent,
    AnomalousVolumeSettingsComponent
  ]
})
export class AnomalousVolumeWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly positionsService = inject(PositionsService);
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly quotesService = inject(QuotesService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<AnomalousVolumeSettings>;
  effectiveSettings$!: Observable<AnomalousVolumeSettings>;
  sourceMode$!: Observable<AnomalousVolumeSourceMode>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<AnomalousVolumeSettings>(
      this.widgetInstance(),
      'AnomalousVolumeSettings',
      settings => ({
        ...settings,
        instruments: getValueOrDefault(settings.instruments, []),
        sourceMode: getValueOrDefault(settings.sourceMode, 'manual'),
        topTurnoverLimit: getValueOrDefault(settings.topTurnoverLimit, 30),
        excludeZeroPositions: getValueOrDefault(settings.excludeZeroPositions, true),
        timeframe: getValueOrDefault(settings.timeframe, '1m'),
        windowSize: getValueOrDefault(settings.windowSize, 30),
        sigmaMultiplier: getValueOrDefault(settings.sigmaMultiplier, 2.5),
        soundAlertEnabled: getValueOrDefault(settings.soundAlertEnabled, true),
        showLargeTrades: getValueOrDefault(settings.showLargeTrades, true),
        largeTradeMinVolume: getValueOrDefault(settings.largeTradeMinVolume, 10000),
        maxInstruments: getValueOrDefault(settings.maxInstruments, 50),
        anomalousVolumeColumns: getValueOrDefault(
          settings.anomalousVolumeColumns,
          anomalousVolumeWidgetColumns.map(c => c.id)
        )
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AnomalousVolumeSettings>(this.guid);
    this.sourceMode$ = this.settings$.pipe(map(s => s.sourceMode ?? 'manual'));
    this.effectiveSettings$ = this.settings$.pipe(
      switchMap(settings => this.resolveEffectiveSettings(settings))
    );
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  protected getSourceModeLabel(mode: AnomalousVolumeSourceMode): string {
    switch (mode) {
      case 'dashboard-instrument':
        return 'Контекст: инструмент';
      case 'dashboard-portfolio':
        return 'Контекст: портфель';
      case 'moex-top-turnover-session':
        return 'MOEX: топ по обороту (сессия)';
      case 'manual':
      default:
        return 'Ручной список';
    }
  }

  private resolveEffectiveSettings(settings: AnomalousVolumeSettings): Observable<AnomalousVolumeSettings> {
    if (settings.sourceMode === 'dashboard-instrument') {
      return this.dashboardContextService.instrumentsSelection$.pipe(
        map(groups => {
          const current = Object.values(groups)[0] ?? null;
          const hasCurrent = current != null;
          return {
            ...settings,
            instruments: hasCurrent ? [current] : settings.instruments
          };
        })
      );
    }

    if (settings.sourceMode === 'dashboard-portfolio') {
      return this.dashboardContextService.selectedPortfolio$.pipe(
        switchMap(portfolio => this.positionsService.getAllByPortfolio(portfolio.portfolio, portfolio.exchange)),
        map((positions: Position[] | null) => {
          const source = (positions ?? [])
            .filter(p => settings.excludeZeroPositions ? p.qtyTFuture !== 0 : true)
            .slice(0, 20)
            .map(p => p.targetInstrument);

          return {
            ...settings,
            instruments: this.toUniqueInstruments(source, settings.instruments)
          };
        })
      );
    }

    if (settings.sourceMode === 'moex-top-turnover-session') {
      return this.resolveMoexTopTurnoverSettings(settings);
    }

    return of(settings);
  }

  private resolveMoexTopTurnoverSettings(settings: AnomalousVolumeSettings): Observable<AnomalousVolumeSettings> {
    const topLimit = Math.max(1, Math.min(50, settings.topTurnoverLimit ?? 30));

    return this.instrumentsService.getInstruments({
      query: '',
      limit: 300,
      exchange: 'MOEX',
      instrumentGroup: 'TQBR'
    }).pipe(
      switchMap((instruments: Instrument[]) => {
        const requests = instruments.map(i => this.quotesService.getLastQuoteInfo(i.symbol, i.exchange).pipe(
          map(quote => ({ instrument: i, turnover: (quote?.volume ?? 0) * (quote?.last_price ?? 0) })),
          catchError(() => of({ instrument: i, turnover: 0 }))
        ));

        return requests.length > 0 ? forkJoin(requests) : of([]);
      }),
      map(items => {
        const topInstruments = items
          .filter(x => x.turnover > 0)
          .sort((a, b) => b.turnover - a.turnover)
          .slice(0, topLimit)
          .map(x => ({
            exchange: x.instrument.exchange,
            symbol: x.instrument.symbol,
            instrumentGroup: x.instrument.instrumentGroup
          }));

        return {
          ...settings,
          instruments: topInstruments.length > 0 ? topInstruments : settings.instruments
        };
      }),
      catchError(() => of(settings))
    );
  }

  private toUniqueInstruments(primary: InstrumentKey[], fallback: InstrumentKey[]): InstrumentKey[] {
    const map = new Map<string, InstrumentKey>();
    for (const i of primary) {
      map.set(`${i.exchange}:${i.symbol}:${i.instrumentGroup ?? ''}`, i);
    }

    if (map.size === 0) {
      for (const i of fallback) {
        map.set(`${i.exchange}:${i.symbol}:${i.instrumentGroup ?? ''}`, i);
      }
    }

    return Array.from(map.values());
  }
}
