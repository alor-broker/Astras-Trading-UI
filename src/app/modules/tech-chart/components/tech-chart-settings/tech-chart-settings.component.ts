import {
  Component,
  DestroyRef,
  OnInit,
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
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

  form?: UntypedFormGroup;
  isSyntheticInstrument = SyntheticInstrumentsHelper.isSyntheticInstrument;

  protected settings$!: Observable<TechChartSettings>;
  deviceInfo$!: Observable<DeviceInfo>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
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
      this.form = new UntypedFormGroup({
        instrument: new UntypedFormControl({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        } as InstrumentKey, Validators.required),
        exchange: new UntypedFormControl({ value: settings.exchange, disabled: true }, Validators.required),
        instrumentGroup: new UntypedFormControl(settings.instrumentGroup),
        showTrades: new UntypedFormControl(settings.showTrades ?? false),
        showOrders: new UntypedFormControl(settings.showOrders ?? true),
        ordersLineMarkerPosition: new UntypedFormControl(settings.ordersLineMarkerPosition ?? LineMarkerPosition.Right),
        showPosition: new UntypedFormControl(settings.showPosition ?? true),
        positionLineMarkerPosition: new UntypedFormControl(settings.positionLineMarkerPosition ?? LineMarkerPosition.Right),
      });
    });
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form!.controls.exchange.setValue(instrument?.exchange ?? null);
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
}
