import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  ViewEncapsulation
} from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import {NzColorPickerComponent} from 'ng-zorro-antd/color-picker';
import {NzFormModule} from 'ng-zorro-antd/form';
import {WidgetSettingsControlBase} from '../widget-settings-control.base';

/** Standard compact color picker used in widget settings. */
@Component({
  selector: 'ats-widget-settings-color-picker',
  imports: [
    FormsModule,
    NzColorPickerComponent,
    NzFormModule
  ],
  template: `
    <nz-form-item nzLayout="horizontal">
      <nz-form-control [nzValidateStatus]="ngControl() ?? ''">
        <nz-color-picker
          (ngModelChange)="updateValue($event)"
          [attr.id]="resolvedControlId()"
          [ngModel]="value() ?? ''"
          [ngModelOptions]="ngModelOptions"
          [nzDisabled]="disabled()"
        />
      </nz-form-control>
      <nz-form-label nzNoColon [nzFor]="resolvedControlId()">{{ label() }}</nz-form-label>
    </nz-form-item>
  `,
  styleUrl: './widget-settings-color-picker.less',
  host: {
    '(focusout)': 'markAsTouched()',
    '[style.display]': "'contents'"
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WidgetSettingsColorPicker),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsColorPicker extends WidgetSettingsControlBase<string> {
}
