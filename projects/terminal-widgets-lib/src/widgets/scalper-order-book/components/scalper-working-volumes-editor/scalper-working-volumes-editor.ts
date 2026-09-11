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
  ReactiveFormsModule
} from '@angular/forms';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';

@Component({
  selector: 'ats-scalper-working-volumes-editor',
  imports: [ReactiveFormsModule, TranslocoDirective, NzButtonComponent, NzIconDirective, InputNumber, WidgetSettingsFormItem],
  templateUrl: './scalper-working-volumes-editor.html',
  styleUrl: './scalper-working-volumes-editor.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ScalperWorkingVolumesEditor {
  readonly volumes = input.required<FormArray<FormControl<number>>>();

  readonly validationOptions = input.required<{ min: number, max: number }>();

  readonly addClick = output();

  readonly removeClick = output<number>();
}
