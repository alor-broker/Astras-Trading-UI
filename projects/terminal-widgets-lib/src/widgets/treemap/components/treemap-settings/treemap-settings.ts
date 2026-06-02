import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {WidgetSettingsBase,} from '@terminal-widgets-lib/common/widget-settings.base';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  NzMarks,
  NzSliderComponent
} from 'ng-zorro-antd/slider';
import {Observable} from 'rxjs';
import {TreemapWidgetSettings} from '../../widget-settings.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormModule} from 'ng-zorro-antd/form';
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';

@Component({
  selector: 'ats-treemap-settings',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzFormModule,
    NzSliderComponent,
    WidgetSettings
  ],
  templateUrl: './treemap-settings.html',
  styleUrl: './treemap-settings.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreemapSettings extends WidgetSettingsBase<TreemapWidgetSettings> implements OnInit {
  readonly validation = {
    refreshIntervalSec: {
      min: 30,
      max: 600
    }
  };

  readonly marks: NzMarks = {
    [this.validation.refreshIntervalSec.min]: this.validation.refreshIntervalSec.min.toString(),
    [this.validation.refreshIntervalSec.max]: this.validation.refreshIntervalSec.max.toString(),
  };

  protected settings$!: Observable<TreemapWidgetSettings>;

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

  protected setCurrentFormValues(settings: TreemapWidgetSettings): void {
    this.form.reset();

    this.form.controls.refreshIntervalSec.setValue(settings.refreshIntervalSec ?? 60);
  }

  protected getUpdatedSettings(): Partial<TreemapWidgetSettings> {
    return {
      refreshIntervalSec: this.form.value.refreshIntervalSec!
    };
  }
}
