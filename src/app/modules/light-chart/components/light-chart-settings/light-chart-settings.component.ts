import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import {
  FormBuilder,
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
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { TimeframeValue } from "../../models/light-chart.models";

@Component({
  selector: 'ats-light-chart-settings',
  templateUrl: './light-chart-settings.component.html',
  styleUrls: ['./light-chart-settings.component.less']
})
export class LightChartSettingsComponent extends WidgetSettingsBaseComponent<LightChartSettings> implements OnInit {
  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    timeFrame: this.formBuilder.nonNullable.control(TimeframeValue.Day, Validators.required),
    timeFrameDisplayMode: this.formBuilder.nonNullable.control(TimeFrameDisplayMode.Buttons, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
    availableTimeFrames: this.formBuilder.nonNullable.control<TimeframeValue[]>([], Validators.required)
  });

  readonly allTimeFrames = Object.values(TimeframeValue);
  timeFrameDisplayModes = TimeFrameDisplayMode;
  deviceInfo$!: Observable<any>;
  protected settings$!: Observable<LightChartSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    protected readonly destroyRef: DestroyRef,
    private readonly deviceService: DeviceService,
    private readonly formBuilder: FormBuilder
  ) {
    super(settingsService, manageDashboardsService, destroyRef);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  checkCurrentTimeFrame(): void {
    const availableTimeFrames = this.sortTimeFrames(this.form.controls.availableTimeFrames.value);
    if (availableTimeFrames.length > 0 && !availableTimeFrames.includes(this.form.controls.timeFrame.value)) {
      this.form.controls.timeFrame.setValue(availableTimeFrames[availableTimeFrames.length - 1]);
    }
  }

  protected getUpdatedSettings(initialSettings: LightChartSettings): Partial<LightChartSettings> {
    const formValue = this.form.value as Partial<LightChartSettings & { instrument: InstrumentKey }>;
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

  protected setCurrentFormValues(settings: LightChartSettings): void {
    this.form.reset();

    this.form.controls.instrument.setValue({
      symbol: settings.symbol,
      exchange: settings.exchange,
      instrumentGroup: settings.instrumentGroup ?? null
    });
    this.form.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);

    this.form.controls.timeFrame.setValue(settings.timeFrame);
    this.form.controls.timeFrameDisplayMode.setValue(settings.timeFrameDisplayMode ?? TimeFrameDisplayMode.Buttons);
    this.form.controls.availableTimeFrames.setValue(settings.availableTimeFrames ?? this.allTimeFrames);
  }

  private sortTimeFrames(selectedTimeFrames: TimeframeValue[]): TimeframeValue[] {
    return [...selectedTimeFrames].sort((a, b) => {
      const aIndex = this.allTimeFrames.indexOf(a);
      const bIndex = this.allTimeFrames.indexOf(b);

      return aIndex - bIndex;
    });
  }
}
