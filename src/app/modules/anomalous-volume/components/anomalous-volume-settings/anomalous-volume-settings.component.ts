import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { WidgetSettingsBaseComponent } from '../../../../shared/components/widget-settings/widget-settings-base.component';
import { WidgetSettingsComponent } from '../../../../shared/components/widget-settings/widget-settings.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { ManageDashboardsService } from '../../../../shared/services/manage-dashboards.service';
import {
  AnomalousVolumeSourceMode,
  AnomalousVolumeSettings,
  AnomalousVolumeTimeframe,
  anomalousVolumeWidgetColumns
} from '../../models/anomalous-volume-settings.model';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { TranslocoDirective } from '@jsverse/transloco';
import { NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { NzSwitchComponent } from 'ng-zorro-antd/switch';
import { InputNumberComponent } from '../../../../shared/components/input-number/input-number.component';
import { InstrumentSearchComponent } from '../../../../shared/components/instrument-search/instrument-search.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { NzTagComponent } from 'ng-zorro-antd/tag';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzRadioComponent, NzRadioGroupComponent } from 'ng-zorro-antd/radio';
import { NzCheckboxComponent } from 'ng-zorro-antd/checkbox';
import { AsyncPipe } from '@angular/common';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { MarketService } from '../../../../shared/services/market.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { map, switchMap, take } from 'rxjs/operators';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';

@Component({
  selector: 'ats-anomalous-volume-settings',
  templateUrl: './anomalous-volume-settings.component.html',
  styleUrl: './anomalous-volume-settings.component.less',
  imports: [
    ReactiveFormsModule,
    WidgetSettingsComponent,
    TranslocoDirective,
    NzFormDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzSwitchComponent,
    InputNumberComponent,
    InstrumentSearchComponent,
    NzButtonComponent,
    NzInputDirective,
    NzSpinComponent,
    NzAlertComponent,
    NzTagComponent,
    NzIconDirective,
    NzRadioGroupComponent,
    NzRadioComponent,
    NzCheckboxComponent,
    AsyncPipe
  ]
})
export class AnomalousVolumeSettingsComponent extends WidgetSettingsBaseComponent<AnomalousVolumeSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly formBuilder = inject(FormBuilder);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly marketService = inject(MarketService);
  private readonly messageService = inject(NzMessageService);

  protected settings$!: Observable<AnomalousVolumeSettings>;

  readonly availableColumns = anomalousVolumeWidgetColumns;
  readonly timeframeOptions: AnomalousVolumeTimeframe[] = ['1m', '5m', '15m'];
  readonly sourceModeOptions: AnomalousVolumeSourceMode[] = ['manual', 'dashboard-instrument', 'dashboard-portfolio'];

  readonly instrumentSearchControl = new FormControl<InstrumentKey | null>(null);
  readonly importRawControl = this.formBuilder.nonNullable.control('');

  showImport = false;
  importValidationInProgress = false;
  importValidated = false;
  importValidKeys: InstrumentKey[] = [];
  importValidLabels: string[] = [];
  importInvalidTokens: string[] = [];

  readonly currentDashboardInstrumentLabel$ = this.dashboardContextService.instrumentsSelection$.pipe(
    map(groups => {
      const instrument = Object.values(groups)[0];
      if (instrument == null) {
        return 'Инструмент не выбран';
      }

      return `${instrument.exchange}:${instrument.symbol}`;
    })
  );

  readonly currentDashboardPortfolioLabel$ = this.dashboardContextService.selectedDashboard$.pipe(
    map(d => {
      const p = d.selectedPortfolio;
      if (p == null) {
        return 'Портфель не выбран';
      }

      return `${p.exchange}:${p.portfolio}`;
    })
  );

  readonly form = this.formBuilder.group({
    sourceMode: this.formBuilder.nonNullable.control<AnomalousVolumeSourceMode>('manual'),
    instruments: this.formBuilder.nonNullable.control<InstrumentKey[]>([]),
    excludeZeroPositions: this.formBuilder.nonNullable.control(true),
    timeframe: this.formBuilder.nonNullable.control<AnomalousVolumeTimeframe>('1m'),
    windowSize: this.formBuilder.nonNullable.control(30, [Validators.required, Validators.min(5), Validators.max(200)]),
    sigmaMultiplier: this.formBuilder.nonNullable.control(2.5, [Validators.required, Validators.min(0.1), Validators.max(10)]),
    soundAlertEnabled: this.formBuilder.nonNullable.control(true),
    anomalousVolumeColumns: this.formBuilder.nonNullable.control<string[]>(
      anomalousVolumeWidgetColumns.map(c => c.id)
    )
  });

  constructor() {
    const settingsService = inject(WidgetSettingsService);
    const manageDashboardsService = inject(ManageDashboardsService);
    const destroyRef = inject(DestroyRef);

    super(settingsService, manageDashboardsService, destroyRef);

    this.settingsService = settingsService;
    this.manageDashboardsService = manageDashboardsService;
    this.destroyRef = destroyRef;
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected getUpdatedSettings(initialSettings: AnomalousVolumeSettings): Partial<AnomalousVolumeSettings> {
    const values = this.form.getRawValue();

    return {
      ...initialSettings,
      sourceMode: values.sourceMode ?? 'manual',
      instruments: (values.instruments ?? []).slice(0, 50),
      excludeZeroPositions: values.excludeZeroPositions ?? true,
      timeframe: values.timeframe ?? '1m',
      windowSize: Number(values.windowSize ?? 30),
      sigmaMultiplier: Number(values.sigmaMultiplier ?? 2.5),
      soundAlertEnabled: values.soundAlertEnabled ?? true,
      anomalousVolumeColumns: values.anomalousVolumeColumns ?? anomalousVolumeWidgetColumns.map(c => c.id)
    };
  }

  protected setCurrentFormValues(settings: AnomalousVolumeSettings): void {
    this.form.reset();

    this.form.controls.sourceMode.setValue(settings.sourceMode ?? 'manual');
    this.form.controls.instruments.setValue(settings.instruments ?? []);
    this.form.controls.excludeZeroPositions.setValue(settings.excludeZeroPositions ?? true);
    this.form.controls.timeframe.setValue(settings.timeframe ?? '1m');
    this.form.controls.windowSize.setValue(settings.windowSize ?? 30);
    this.form.controls.sigmaMultiplier.setValue(settings.sigmaMultiplier ?? 2.5);
    this.form.controls.soundAlertEnabled.setValue(settings.soundAlertEnabled ?? true);
    this.form.controls.anomalousVolumeColumns.setValue(
      settings.anomalousVolumeColumns?.length
        ? settings.anomalousVolumeColumns
        : anomalousVolumeWidgetColumns.map(c => c.id)
    );

    this.resetImportState();
  }

  addInstrumentFromSearch(instrument: InstrumentKey | null): void {
    if (instrument == null) {
      return;
    }

    const current = this.form.controls.instruments.value;
    const merged = this.mergeUniqueInstruments(current, [instrument]);
    if (merged.length > 50) {
      this.messageService.warning('Можно выбрать не более 50 инструментов');
      this.form.controls.instruments.setValue(merged.slice(0, 50));
    } else {
      this.form.controls.instruments.setValue(merged);
    }

    this.form.controls.instruments.markAsDirty();
    this.instrumentSearchControl.setValue(null);
  }

  removeInstrument(index: number): void {
    const next = [...this.form.controls.instruments.value];
    next.splice(index, 1);
    this.form.controls.instruments.setValue(next);
    this.form.controls.instruments.markAsDirty();
  }

  toggleImportPanel(): void {
    this.showImport = !this.showImport;
    if (!this.showImport) {
      this.resetImportState();
    }
  }

  validateImportTokens(): void {
    const tokens = this.parseImportTokens(this.importRawControl.value);
    if (tokens.length === 0) {
      this.resetImportState();
      return;
    }

    this.importValidationInProgress = true;
    this.importValidated = false;

    this.marketService.getDefaultExchange().pipe(
      take(1),
      switchMap(defaultExchange => {
        const effectiveDefaultExchange = (defaultExchange ?? 'MOEX').toUpperCase();
        const prepared = tokens.map(t => ({ token: t, key: this.parseImportToken(t, effectiveDefaultExchange) }));

        let toValidate = prepared;
        if (prepared.length > 50) {
          this.messageService.warning('Импорт ограничен 50 тикерами, лишние будут проигнорированы');
          toValidate = prepared.slice(0, 50);
        }

        return forkJoin(
          toValidate.map(x =>
            this.instrumentsService.getInstrument(x.key).pipe(
              map((instrument: Instrument | null) => ({ token: x.token, key: x.key, instrument }))
            )
          )
        );
      })
    ).subscribe(results => {
      this.importValidationInProgress = false;
      this.importValidated = true;

      const valid = results.filter(r => r.instrument != null).map(r => r.key);
      const uniqueValid = this.mergeUniqueInstruments([], valid);

      this.importValidKeys = uniqueValid;
      this.importValidLabels = uniqueValid.map(i => `${i.exchange}:${i.symbol}`);
      this.importInvalidTokens = results.filter(r => r.instrument == null).map(r => r.token);
    });
  }

  importValidatedInstruments(): void {
    if (!this.importValidated || this.importValidKeys.length === 0) {
      return;
    }

    const merged = this.mergeUniqueInstruments(this.form.controls.instruments.value, this.importValidKeys);
    if (merged.length > 50) {
      this.messageService.warning('Можно сохранить не более 50 инструментов');
      this.form.controls.instruments.setValue(merged.slice(0, 50));
    } else {
      this.form.controls.instruments.setValue(merged);
    }

    this.form.controls.instruments.markAsDirty();
    this.showImport = false;
    this.resetImportState();
  }

  get canImportValidated(): boolean {
    return !this.importValidationInProgress && this.importValidated && this.importValidKeys.length > 0;
  }

  get sourceMode(): AnomalousVolumeSourceMode {
    return this.form.controls.sourceMode.value;
  }

  formatInstrument(item: InstrumentKey): string {
    const instrumentGroup = item.instrumentGroup;
    const hasInstrumentGroup = instrumentGroup != null && instrumentGroup.length > 0;

    return hasInstrumentGroup
      ? `${item.exchange}:${item.symbol}:${instrumentGroup}`
      : `${item.exchange}:${item.symbol}`;
  }

  protected getTimeframeLabel(tf: AnomalousVolumeTimeframe): string {
    switch (tf) {
      case '1m':
        return '1 минута';
      case '5m':
        return '5 минут';
      case '15m':
      default:
        return '15 минут';
    }
  }

  protected getSourceModeLabel(mode: AnomalousVolumeSourceMode): string {
    switch (mode) {
      case 'dashboard-instrument':
        return 'Контекст: инструмент';
      case 'dashboard-portfolio':
        return 'Контекст: портфель';
      case 'manual':
      default:
        return 'Ручной список';
    }
  }

  private parseImportTokens(raw: string): string[] {
    return raw
      .split(/[,;\n\r\t\s]+/)
      .map(x => x.trim().toUpperCase())
      .filter(x => x.length > 0);
  }

  private parseImportToken(token: string, defaultExchange: string): InstrumentKey {
    const parts = token.split(':').map(x => x.trim()).filter(x => x.length > 0);
    if (parts.length === 1) {
      return {
        exchange: defaultExchange,
        symbol: parts[0]
      };
    }

    if (parts.length === 2) {
      return {
        exchange: parts[0],
        symbol: parts[1]
      };
    }

    return {
      exchange: parts[0],
      symbol: parts[1],
      instrumentGroup: parts[2]
    };
  }

  private mergeUniqueInstruments(base: InstrumentKey[], extra: InstrumentKey[]): InstrumentKey[] {
    const result = [...base];
    const keyOf = (i: InstrumentKey): string => `${i.exchange}:${i.symbol}`;
    const seen = new Set(result.map(keyOf));

    for (const item of extra) {
      const key = keyOf(item);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      result.push(item);
    }

    return result;
  }

  private resetImportState(): void {
    this.importRawControl.setValue('');
    this.importValidationInProgress = false;
    this.importValidated = false;
    this.importValidKeys = [];
    this.importValidLabels = [];
    this.importInvalidTokens = [];
  }
}
