import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  Observable,
  take
} from "rxjs";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from 'ng-zorro-antd/form';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from 'ng-zorro-antd/collapse';
import {AsyncPipe} from '@angular/common';
import {WidgetSettingsBase} from "@terminal-widgets-lib/common/widget-settings.base";
import {
  LightChartWidgetSettings,
  TimeFrameDisplayMode
} from '@terminal-widgets-lib/widgets/light-chart/widget-settings.types';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {DeviceInfo} from '@terminal-core-lib/common/services/device-service-types';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';
import {RemoveSelectTitles} from '@terminal-core-lib/common/directives/remove-select-titles';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';

@Component({
  selector: 'ats-light-chart-settings',
  templateUrl: './light-chart-settings.html',
  styleUrls: ['./light-chart-settings.less'],
  imports: [
    WidgetSettings,
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormLabelComponent,
    NzInputDirective,
    NzSelectComponent,
    RemoveSelectTitles,
    NzOptionComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    InstrumentBoardSelect,
    AsyncPipe,
    InlineInstrumentSearch
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LightChartSettingsComponent extends WidgetSettingsBase<LightChartWidgetSettings> implements OnInit {
  readonly allTimeFrames = Object.values(TimeframeValue);

  timeFrameDisplayModes = TimeFrameDisplayMode;

  deviceInfo$!: Observable<DeviceInfo>;

  protected settings$!: Observable<LightChartWidgetSettings>;

  private readonly deviceService = inject(DeviceService);

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    timeFrame: this.formBuilder.nonNullable.control(TimeframeValue.Day, Validators.required),
    timeFrameDisplayMode: this.formBuilder.nonNullable.control(TimeFrameDisplayMode.Buttons, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
    availableTimeFrames: this.formBuilder.nonNullable.control<TimeframeValue[]>([], Validators.required)
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  override ngOnInit(): void {
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

  protected getUpdatedSettings(initialSettings: LightChartWidgetSettings): Partial<LightChartWidgetSettings> {
    const formValue = this.form.value as Partial<LightChartWidgetSettings & { instrument: InstrumentKey }>;
    const newSettings = {
      ...formValue,
      symbol: formValue.instrument?.symbol,
      exchange: formValue.instrument?.exchange
    } as LightChartWidgetSettings & { instrument?: InstrumentKey };

    newSettings.availableTimeFrames = this.sortTimeFrames(newSettings.availableTimeFrames ?? []);

    delete newSettings.instrument;

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && InstrumentEqualityComparer.equals(initialSettings, newSettings);

    return newSettings;
  }

  protected setCurrentFormValues(settings: LightChartWidgetSettings): void {
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
