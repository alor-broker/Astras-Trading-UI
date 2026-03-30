import { Component, input, OnInit, inject } from '@angular/core';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {SettingsHelper} from '../../../../shared/utils/settings-helper';
import {Observable, take} from 'rxjs';
import {LineMarkerPosition, TechChartSettings, TradeDisplayMarker} from '../../models/tech-chart-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from 'src/app/shared/services/terminal-settings.service';
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {map} from "rxjs/operators";
import {SyntheticInstrumentsHelper} from "../../utils/synthetic-instruments.helper";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {InstrumentSearchService} from "../../services/instrument-search.service";
import {ThemeService} from "../../../../shared/services/theme.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {
  WidgetHeaderInstrumentSwitchComponent
} from '../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component';
import {TechChartComponent} from '../../components/tech-chart/tech-chart.component';
import {TechChartSettingsComponent} from '../../components/tech-chart-settings/tech-chart-settings.component';
import {InstrumentSearchModalComponent} from '../instrument-search-modal/instrument-search-modal.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-tech-chart-widget',
  templateUrl: './tech-chart-widget.component.html',
  styleUrls: ['./tech-chart-widget.component.less'],
  providers: [
    InstrumentSearchService
  ],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    WidgetHeaderInstrumentSwitchComponent,
    TechChartComponent,
    TechChartSettingsComponent,
    InstrumentSearchModalComponent,
    AsyncPipe
  ]
})
export class TechChartWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly themeService = inject(ThemeService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<TechChartSettings>;
  showBadge$!: Observable<boolean>;
  headerTitle$!: Observable<string | null>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    this.themeService.getThemeSettings().pipe(
      take(1)
    ).subscribe(theme => {
      WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<TechChartSettings & InstrumentKey>(
        this.widgetInstance(),
        'TechChartSettings',
        settings => ({
          ...settings,
          showTrades: getValueOrDefault(settings.showTrades, false),
          showOrders: getValueOrDefault(settings.showOrders, true),
          ordersLineMarkerPosition: getValueOrDefault(settings.ordersLineMarkerPosition, LineMarkerPosition.Middle),
          showPosition: getValueOrDefault(settings.showPosition, true),
          positionLineMarkerPosition: getValueOrDefault(settings.positionLineMarkerPosition, LineMarkerPosition.Middle),
          panels: getValueOrDefault(
            settings.panels,
            {
              timeframesBottomToolbar: true,
              drawingsToolbar: true,
              header: true,
              headerSymbolSearch: true,
              headerChartType: true,
              headerCompare: true,
              headerResolutions: true,
              headerIndicators: true,
              headerScreenshot: true,
              headerSettings: true,
              headerUndoRedo: true,
              headerFullscreenButton: true
            }
          ),
          trades: getValueOrDefault(
            settings.trades,
            {
              marker: TradeDisplayMarker.Note,
              buyTradeColor: theme.themeColors.buyColorAccent,
              sellTradeColor: theme.themeColors.sellColorAccent,
              markerSize: 20
            }
          ),
          orders: {
            editWithoutConfirmation: false
          }
        }),
        this.dashboardContextService,
        this.widgetSettingsService
      );
    });

    this.settings$ = this.widgetSettingsService.getSettings<TechChartSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
    this.headerTitle$ = this.settings$.pipe(
      map(s => SyntheticInstrumentsHelper.isSyntheticInstrument(s.symbol) ? s.symbol : null)
    );
  }
}
