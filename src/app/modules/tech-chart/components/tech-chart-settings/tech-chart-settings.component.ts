import {
  Component,
  DestroyRef,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import {
  Observable,
  take
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  LineMarkerPosition,
  TechChartSettings
} from '../../models/tech-chart-settings.model';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { SyntheticInstrumentsHelper } from "../../utils/synthetic-instruments.helper";
import { DeviceService } from "../../../../shared/services/device.service";
import { DeviceInfo } from "../../../../shared/models/device-info.model";

@Component({
  selector: 'ats-tech-chart-settings',
  templateUrl: './tech-chart-settings.component.html',
  styleUrls: ['./tech-chart-settings.component.less']
})
export class TechChartSettingsComponent extends WidgetSettingsBaseComponent<TechChartSettings> implements OnInit {
  readonly availableLineMarkerPositions = Object.values(LineMarkerPosition);

  form = this.formBuilder.group({
    // instrument
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
    // view
    showTrades: this.formBuilder.nonNullable.control(false),
    showOrders: this.formBuilder.nonNullable.control(true),
    ordersLineMarkerPosition: this.formBuilder.nonNullable.control(LineMarkerPosition.Right),
    showPosition: this.formBuilder.nonNullable.control(true),
    positionLineMarkerPosition: this.formBuilder.nonNullable.control(LineMarkerPosition.Right),
    panels: this.formBuilder.group({
      header:this.formBuilder.nonNullable.control(true),
      headerSymbolSearch: this.formBuilder.nonNullable.control(true),
      headerChartType: this.formBuilder.nonNullable.control(true),
      headerCompare: this.formBuilder.nonNullable.control(true),
      headerResolutions: this.formBuilder.nonNullable.control(true),
      headerIndicators: this.formBuilder.nonNullable.control(true),
      headerScreenshot: this.formBuilder.nonNullable.control(true),
      headerSettings: this.formBuilder.nonNullable.control(true),
      headerUndoRedo: this.formBuilder.nonNullable.control(true),
      headerFullscreenButton: this.formBuilder.nonNullable.control(true),
      drawingsToolbar: this.formBuilder.nonNullable.control(true),
      timeframesBottomToolbar: this.formBuilder.nonNullable.control(true),
    })
  });

  isSyntheticInstrument = SyntheticInstrumentsHelper.isSyntheticInstrument;
  deviceInfo$!: Observable<DeviceInfo>;
  protected settings$!: Observable<TechChartSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    private readonly formBuilder: FormBuilder,
    private readonly deviceService: DeviceService,
    private readonly destroyRef: DestroyRef
  ) {
    super(settingsService, manageDashboardsService);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form?.valid ?? false;
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.setCurrentFormValues(settings);
    });
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form!.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  protected getUpdatedSettings(initialSettings: TechChartSettings): Partial<TechChartSettings> {
    const formValue = this.form!.value as Partial<TechChartSettings & { instrument: InstrumentKey }>;
    const newSettings = {
      ...this.form!.value,
      symbol: formValue.instrument?.symbol,
      exchange: formValue.instrument?.exchange,
    } as TechChartSettings;

    delete newSettings.instrument;

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && isInstrumentEqual(initialSettings as InstrumentKey, newSettings as InstrumentKey);

    return newSettings;
  }

  private setCurrentFormValues(settings: TechChartSettings): void {
    this.form.reset();

    this.form.controls.instrument.setValue({
      symbol: settings.symbol,
      exchange: settings.exchange ?? '',
      instrumentGroup: settings.instrumentGroup ?? null
    });
    this.form.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);

    this.form.controls.showTrades.setValue(settings.showTrades ?? false);
    this.form.controls.showOrders.setValue(settings.showOrders ?? true);
    this.form.controls.ordersLineMarkerPosition.setValue(settings.ordersLineMarkerPosition ?? LineMarkerPosition.Right);
    this.form.controls.showPosition.setValue(settings.showPosition ?? true);
    this.form.controls.positionLineMarkerPosition.setValue(settings.positionLineMarkerPosition ?? LineMarkerPosition.Right);

    this.form.controls.panels.setValue({
      header: settings.panels?.header ?? true,
      headerSymbolSearch: settings.panels?.headerSymbolSearch ?? true,
      headerCompare: settings.panels?.headerCompare ?? true,
      headerResolutions: settings.panels?.headerResolutions ?? true,
      headerChartType: settings.panels?.headerChartType ?? true,
      headerIndicators: settings.panels?.headerIndicators ?? true,
      headerScreenshot: settings.panels?.headerScreenshot ?? true,
      headerSettings: settings.panels?.headerSettings ?? true,
      headerUndoRedo: settings.panels?.headerUndoRedo ?? true,
      headerFullscreenButton: settings.panels?.headerFullscreenButton ?? true,
      drawingsToolbar: settings.panels?.drawingsToolbar ?? true,
      timeframesBottomToolbar: settings.panels?.timeframesBottomToolbar ?? true,
    });
  }
}
