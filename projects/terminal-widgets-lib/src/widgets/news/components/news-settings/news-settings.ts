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
} from "@angular/forms";
import {
  NzMarks,
  NzSliderComponent
} from "ng-zorro-antd/slider";
import {TranslocoDirective} from '@jsverse/transloco';
import {NewsWidgetSettings} from '@terminal-widgets-lib/widgets/news/widget-settings.types';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';

@Component({
  selector: 'ats-news-settings',
  templateUrl: './news-settings.html',
  styleUrls: ['./news-settings.less'],
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzSliderComponent,
    WidgetSettingsEditor,
    WidgetSettingsForm,
    WidgetSettingsFormItem
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NewsSettings extends WidgetSettingsBase<NewsWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly validation = {
    refreshIntervalSec: {
      min: 5,
      max: 600
    }
  };

  readonly marks: NzMarks = {
    [this.validation.refreshIntervalSec.min]: this.validation.refreshIntervalSec.min.toString(),
    [this.validation.refreshIntervalSec.max]: this.validation.refreshIntervalSec.max.toString(),
  };

  protected settings$!: Observable<NewsWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    refreshIntervalSec: this.formBuilder.nonNullable.control(
      60,
      {
        validators: [
          Validators.required,
          Validators.min(this.validation.refreshIntervalSec.min),
          Validators.max(this.validation.refreshIntervalSec.max)
        ]
      }
    )
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  protected setCurrentFormValues(settings: NewsWidgetSettings): void {
    this.form.reset();

    this.form.controls.refreshIntervalSec.setValue(settings.refreshIntervalSec ?? 60);
  }

  protected getUpdatedSettings(): Partial<NewsWidgetSettings> {
    return {
      refreshIntervalSec: this.form.controls.refreshIntervalSec.value
    };
  }
}
