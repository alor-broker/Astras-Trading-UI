import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {Observable} from 'rxjs';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {AsyncPipe} from '@angular/common';
import {WidgetSettingsBase} from "@terminal-widgets-lib/common/widget-settings.base";
import {
  LightChartWidgetSettings,
  TimeFrameDisplayMode
} from '@terminal-widgets-lib/widgets/light-chart/widget-settings.types';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';
import {RemoveSelectTitles} from '@terminal-core-lib/common/directives/remove-select-titles';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {
  InstrumentEqualityComparer,
  InstrumentKeyHelper
} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';
import {SettingsDeviceVisibility} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-visibility.types';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';

@Component({
  selector: 'ats-light-chart-settings',
  templateUrl: './light-chart-settings.html',
  imports: [
    WidgetSettingsEditor,
    WidgetSettingsGroup,
    WidgetSettingsForm,
    WidgetSettingsFormItem,
    TranslocoDirective,
    ReactiveFormsModule,
    NzInputDirective,
    NzSelectComponent,
    RemoveSelectTitles,
    NzOptionComponent,
    InstrumentBoardSelect,
    AsyncPipe,
    InlineInstrumentSearch
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LightChartSettingsComponent extends WidgetSettingsBase<LightChartWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly DeviceVisibility = SettingsDeviceVisibility;

  readonly allTimeFrames = Object.values(TimeframeValue);

  readonly timeFrameDisplayModes = TimeFrameDisplayMode;

  protected settings$!: Observable<LightChartWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.group({
      instrumentKey: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
      instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null)
    }),
    timeframes: this.formBuilder.group({
      timeFrame: this.formBuilder.nonNullable.control(TimeframeValue.Day, Validators.required),
      timeFrameDisplayMode: this.formBuilder.nonNullable.control(TimeFrameDisplayMode.Buttons, Validators.required),
      availableTimeFrames: this.formBuilder.nonNullable.control<TimeframeValue[]>([], Validators.required)
    })
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  protected get instrument(): InstrumentKey | null {
    return this.form.controls.instrument.controls.instrumentKey.value;
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrument.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  checkCurrentTimeFrame(): void {
    const controls = this.form.controls.timeframes.controls;
    const availableTimeFrames = this.sortTimeFrames(controls.availableTimeFrames.value);
    if (availableTimeFrames.length > 0 && !availableTimeFrames.includes(controls.timeFrame.value)) {
      controls.timeFrame.setValue(availableTimeFrames[availableTimeFrames.length - 1]);
    }
  }

  protected getUpdatedSettings(initialSettings: LightChartWidgetSettings): Partial<LightChartWidgetSettings> {
    const value = this.form.getRawValue();
    const instrument = InstrumentKeyHelper.toInstrumentKey({
      ...value.instrument.instrumentKey ?? initialSettings,
      instrumentGroup: value.instrument.instrumentGroup
    });

    return {
      ...instrument,
      ...value.timeframes,
      availableTimeFrames: this.sortTimeFrames(value.timeframes.availableTimeFrames),
      linkToActive: (initialSettings.linkToActive ?? false) && InstrumentEqualityComparer.equals(initialSettings, instrument)
    };
  }

  protected setCurrentFormValues(settings: LightChartWidgetSettings): void {
    this.form.reset({
      instrument: {
        instrumentKey: InstrumentKeyHelper.toInstrumentKey(settings),
        instrumentGroup: settings.instrumentGroup ?? null
      },
      timeframes: {
        timeFrame: settings.timeFrame ?? TimeframeValue.Day,
        timeFrameDisplayMode: settings.timeFrameDisplayMode ?? TimeFrameDisplayMode.Buttons,
        availableTimeFrames: settings.availableTimeFrames ?? this.allTimeFrames
      }
    });
  }

  private sortTimeFrames(selectedTimeFrames: TimeframeValue[]): TimeframeValue[] {
    return [...selectedTimeFrames].sort((a, b) => {
      const aIndex = this.allTimeFrames.indexOf(a);
      const bIndex = this.allTimeFrames.indexOf(b);

      return aIndex - bIndex;
    });
  }
}
