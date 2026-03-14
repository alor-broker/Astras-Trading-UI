import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { WidgetSettingsBaseComponent } from '../../../../shared/components/widget-settings/widget-settings-base.component';
import { WidgetSettingsComponent } from '../../../../shared/components/widget-settings/widget-settings.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { ManageDashboardsService } from '../../../../shared/services/manage-dashboards.service';
import {
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
    InputNumberComponent
  ]
})
export class AnomalousVolumeSettingsComponent extends WidgetSettingsBaseComponent<AnomalousVolumeSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly formBuilder = inject(FormBuilder);

  protected settings$!: Observable<AnomalousVolumeSettings>;

  readonly availableColumns = anomalousVolumeWidgetColumns;
  readonly timeframeOptions: AnomalousVolumeTimeframe[] = ['1m', '5m', '15m'];

  readonly form = this.formBuilder.group({
    instruments: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    timeframe: this.formBuilder.nonNullable.control<AnomalousVolumeTimeframe>('1m'),
    windowSize: this.formBuilder.nonNullable.control(30, [Validators.required, Validators.min(5), Validators.max(200)]),
    sigmaMultiplier: this.formBuilder.nonNullable.control(2.5, [Validators.required, Validators.min(0.1), Validators.max(10)]),
    soundAlertEnabled: this.formBuilder.nonNullable.control(true),
    anomalousVolumeColumns: this.formBuilder.nonNullable.control<string[]>(
      anomalousVolumeWidgetColumns.map(c => c.id),
      Validators.required
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
      instruments: (values.instruments ?? [])
        .map(token => this.parseInstrumentToken(token))
        .filter((i): i is InstrumentKey => i != null)
        .slice(0, 50),
      timeframe: values.timeframe ?? '1m',
      windowSize: Number(values.windowSize ?? 30),
      sigmaMultiplier: Number(values.sigmaMultiplier ?? 2.5),
      soundAlertEnabled: values.soundAlertEnabled ?? true,
      anomalousVolumeColumns: values.anomalousVolumeColumns ?? anomalousVolumeWidgetColumns.map(c => c.id)
    };
  }

  protected setCurrentFormValues(settings: AnomalousVolumeSettings): void {
    this.form.reset();

    this.form.controls.instruments.setValue((settings.instruments ?? []).map(i => this.toInstrumentToken(i)));
    this.form.controls.timeframe.setValue(settings.timeframe ?? '1m');
    this.form.controls.windowSize.setValue(settings.windowSize ?? 30);
    this.form.controls.sigmaMultiplier.setValue(settings.sigmaMultiplier ?? 2.5);
    this.form.controls.soundAlertEnabled.setValue(settings.soundAlertEnabled ?? true);
    this.form.controls.anomalousVolumeColumns.setValue(
      settings.anomalousVolumeColumns?.length
        ? settings.anomalousVolumeColumns
        : anomalousVolumeWidgetColumns.map(c => c.id)
    );
  }

  private parseInstrumentToken(value: string): InstrumentKey | null {
    const token = value.trim().toUpperCase();
    if (!token) {
      return null;
    }

    const parts = token.split(':');
    if (parts.length === 1) {
      return {
        symbol: parts[0],
        exchange: 'MOEX'
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

  private toInstrumentToken(value: InstrumentKey): string {
    if (value.instrumentGroup != null && value.instrumentGroup.length > 0) {
      return `${value.exchange}:${value.symbol}:${value.instrumentGroup}`;
    }

    return `${value.exchange}:${value.symbol}`;
  }
}
