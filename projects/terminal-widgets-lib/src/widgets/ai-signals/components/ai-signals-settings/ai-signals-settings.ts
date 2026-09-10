import {
  ChangeDetectionStrategy,
  Component,
  inject,
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
import {NzFormModule} from 'ng-zorro-antd/form';
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';
import {
  AiSignalsWidgetSettings,
  defaultAiSignalsWidgetSettings
} from '../../widget-settings.types';

@Component({
  selector: 'ats-ai-signals-settings',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzFormModule,
    NzSliderComponent,
    WidgetSettings
  ],
  templateUrl: './ai-signals-settings.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiSignalsSettings extends WidgetSettingsBase<AiSignalsWidgetSettings> {
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

  form = this.formBuilder.group({
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
      refreshIntervalSec: this.form.value.refreshIntervalSec!
    };
  }
}
