import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {Observable} from 'rxjs';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {
  NzMarks,
  NzSliderComponent
} from "ng-zorro-antd/slider";
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
import {NewsWidgetSettings} from '@terminal-widgets-lib/widgets/news/widget-settings.types';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';

@Component({
  selector: 'ats-news-settings',
  templateUrl: './news-settings.html',
  styleUrls: ['./news-settings.less'],
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormLabelComponent,
    NzSliderComponent,
    WidgetSettings
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NewsSettings extends WidgetSettingsBase<NewsWidgetSettings> implements OnInit {
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

  form = this.formBuilder.group({
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
      refreshIntervalSec: this.form.value.refreshIntervalSec!
    };
  }
}
