import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {Observable} from "rxjs";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {OptionBoardWidgetSettings} from '@terminal-widgets-lib/widgets/option-board/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';

@Component({
  selector: 'ats-option-board-settings',
  templateUrl: './option-board-settings.html',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzInputDirective,
    WidgetSettingsEditor,
    WidgetSettingsForm,
    WidgetSettingsFormItem,
    InlineInstrumentSearch,
    InstrumentBoardSelect,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OptionBoardSettings extends WidgetSettingsBase<OptionBoardWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  protected settings$!: Observable<OptionBoardWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    instrument: this.formBuilder.nonNullable.control<InstrumentKey | null>(null, Validators.required),
    instrumentGroup: this.formBuilder.nonNullable.control<string | null>(null),
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  instrumentSelected(instrument: InstrumentKey | null): void {
    this.form.controls.instrumentGroup.setValue(instrument?.instrumentGroup ?? null);
  }

  protected getUpdatedSettings(initialSettings: OptionBoardWidgetSettings): Partial<OptionBoardWidgetSettings> {
    const formValue = this.form.getRawValue();

    const newSettings: Partial<OptionBoardWidgetSettings> & InstrumentKey = {
      symbol: formValue.instrument?.symbol ?? '',
      exchange: formValue.instrument?.exchange ?? '',
      instrumentGroup: formValue.instrumentGroup ?? formValue.instrument?.instrumentGroup,
    };

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && InstrumentEqualityComparer.equals(initialSettings, newSettings);

    return newSettings;
  }

  protected setCurrentFormValues(settings: OptionBoardWidgetSettings): void {
    this.form.reset();

    this.form.controls.instrument.setValue({
      symbol: settings.symbol,
      exchange: settings.exchange,
      instrumentGroup: settings.instrumentGroup ?? null
    });
    this.form.controls.instrumentGroup.setValue(settings.instrumentGroup ?? null);
  }
}
