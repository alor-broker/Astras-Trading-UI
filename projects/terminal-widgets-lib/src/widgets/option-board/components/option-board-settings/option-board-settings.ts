import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {Observable} from "rxjs";
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
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
  NzCollapseComponent,
  NzCollapsePanelComponent
} from 'ng-zorro-antd/collapse';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {OptionBoardWidgetSettings} from '@terminal-widgets-lib/widgets/option-board/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';

@Component({
  selector: 'ats-option-board-settings',
  templateUrl: './option-board-settings.html',
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzInputDirective,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    WidgetSettings,
    InlineInstrumentSearch,
    InstrumentBoardSelect,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OptionBoardSettings extends WidgetSettingsBase<OptionBoardWidgetSettings> implements OnInit {
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
    const formValue = this.form.value as Partial<InstrumentKey & { instrument: InstrumentKey }>;

    const newSettings: Partial<OptionBoardWidgetSettings> & InstrumentKey = {
      symbol: formValue.instrument?.symbol ?? '',
      exchange: formValue.instrument?.exchange ?? '',
      instrumentGroup: formValue.instrumentGroup ?? formValue.instrument?.instrumentGroup,
    };

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && InstrumentEqualityComparer.equals(initialSettings, newSettings);

    return newSettings as Partial<OptionBoardWidgetSettings>;
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
