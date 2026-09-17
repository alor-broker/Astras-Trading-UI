import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {Observable} from 'rxjs';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  NzMarks,
  NzSliderComponent
} from 'ng-zorro-antd/slider';
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';
import {
  AiSignalsWidgetSettings,
  defaultAiSignalsWidgetSettings
} from '../../widget-settings.types';

@Component({
  selector: 'ats-ai-signals-settings',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzSliderComponent,
    WidgetSettingsEditor,
    WidgetSettingsForm,
    WidgetSettingsFormItem
  ],
  templateUrl: './ai-signals-settings.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiSignalsSettings extends WidgetSettingsBase<AiSignalsWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly validationOptions = {
    refreshIntervalSec: {
      min: 30,
      max: 600
    }
  };

  readonly marks: NzMarks = {
    [this.validationOptions.refreshIntervalSec.min]: this.validationOptions.refreshIntervalSec.min.toString(),
    [this.validationOptions.refreshIntervalSec.max]: this.validationOptions.refreshIntervalSec.max.toString(),
  };

  protected settings$!: Observable<AiSignalsWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    refreshIntervalSec: this.formBuilder.nonNullable.control(
      defaultAiSignalsWidgetSettings.refreshIntervalSec,
      {
        validators: [
          Validators.required,
          Validators.min(this.validationOptions.refreshIntervalSec.min),
          Validators.max(this.validationOptions.refreshIntervalSec.max)
        ]
      }
    )
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  protected setCurrentFormValues(settings: AiSignalsWidgetSettings): void {
    this.form.reset();

    this.form.controls.refreshIntervalSec.setValue(
      settings.refreshIntervalSec ?? defaultAiSignalsWidgetSettings.refreshIntervalSec
    );
  }

  protected getUpdatedSettings(): Partial<AiSignalsWidgetSettings> {
    return {
      refreshIntervalSec: this.form.controls.refreshIntervalSec.value
    };
  }
}
