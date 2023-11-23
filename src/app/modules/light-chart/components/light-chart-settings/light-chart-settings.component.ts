import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  Observable,
  take
} from "rxjs";
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  LightChartSettings,
  TimeFrameDisplayMode
} from '../../models/light-chart-settings.model';
import { DeviceService } from "../../../../shared/services/device.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TimeframeValue } from "../../models/light-chart.models";

@Component({
  selector: 'ats-light-chart-settings',
  templateUrl: './light-chart-settings.component.html',
  styleUrls: ['./light-chart-settings.component.less']
})
export class LightChartSettingsComponent extends WidgetSettingsBaseComponent<LightChartSettings> implements OnInit {
  form?: UntypedFormGroup;
  readonly allTimeFrames = Object.values(TimeframeValue);
  timeFrameDisplayModes = TimeFrameDisplayMode;
  deviceInfo$!: Observable<any>;
  protected settings$!: Observable<LightChartSettings>;

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
        timeFrame: new UntypedFormControl(settings.timeFrame, Validators.required),
        timeFrameDisplayMode: new UntypedFormControl(settings.timeFrameDisplayMode ?? TimeFrameDisplayMode.Buttons, Validators.required),
        instrumentGroup: new UntypedFormControl(settings.instrumentGroup),
        availableTimeFrames: new UntypedFormControl(
          settings.availableTimeFrames ?? this.allTimeFrames,
          Validators.required
        )
      });
    });
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form!.controls.exchange.setValue(instrument?.exchange ?? null);
    this.form!.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  checkCurrentTimeFrame(): void {
    const availableTimeFrames = this.sortTimeFrames(this.form!.controls.availableTimeFrames.value as TimeframeValue[]);
    if (availableTimeFrames.length > 0 && !availableTimeFrames.includes(this.form!.controls.timeFrame.value)) {
      this.form!.controls.timeFrame.setValue(availableTimeFrames[availableTimeFrames.length - 1]);
    }
  }

  protected getUpdatedSettings(initialSettings: LightChartSettings): Partial<LightChartSettings> {
    const formValue = this.form!.value as Partial<LightChartSettings & { instrument: InstrumentKey}>;
    const newSettings = {
      ...formValue,
      symbol: formValue.instrument?.symbol,
      exchange: formValue.instrument?.exchange
    } as LightChartSettings;

    newSettings.availableTimeFrames = this.sortTimeFrames(newSettings.availableTimeFrames ?? []);

    delete newSettings.instrument;

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && isInstrumentEqual(initialSettings, newSettings);

    return newSettings;
  }

  private sortTimeFrames(selectedTimeFrames: TimeframeValue[]): TimeframeValue[] {
    return [...selectedTimeFrames].sort((a, b) => {
      const aIndex = this.allTimeFrames.indexOf(a);
      const bIndex = this.allTimeFrames.indexOf(b);

      return aIndex - bIndex;
    });
  }
}
