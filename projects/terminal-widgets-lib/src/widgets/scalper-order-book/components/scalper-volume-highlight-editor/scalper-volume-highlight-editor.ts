import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';
import {WidgetSettingsColorPicker} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-color-picker/widget-settings-color-picker';

@Component({
  selector: 'ats-scalper-volume-highlight-editor',
  imports: [ReactiveFormsModule, TranslocoDirective, NzButtonComponent, NzIconDirective, InputNumber, WidgetSettingsFormItem, WidgetSettingsColorPicker],
  templateUrl: './scalper-volume-highlight-editor.html',
  styleUrl: './scalper-volume-highlight-editor.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ScalperVolumeHighlightEditor {
  readonly options = input.required<FormArray<FormGroup<{
    boundary: FormControl<number>;
    color: FormControl<string>;
  }>>>();

  readonly validationOptions = input.required<{ min: number, max: number }>();

  readonly addClick = output();

  readonly removeClick = output<number>();
}
