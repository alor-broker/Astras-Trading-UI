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
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {WidgetSettingsControlBase} from '../widget-settings-control.base';

/** Standard compact switch used in widget settings. */
@Component({
  selector: 'ats-widget-settings-switch',
  imports: [
    FormsModule,
    NzFormModule,
    NzSwitchComponent
  ],
  template: `
    <nz-form-item nzLayout="horizontal">
      <nz-form-control [nzValidateStatus]="ngControl() ?? ''">
        <nz-switch
          (ngModelChange)="updateValue($event)"
          [ngModel]="value() ?? false"
          [ngModelOptions]="ngModelOptions"
          [nzDisabled]="disabled()"
          [nzId]="resolvedControlId()"
        />
      </nz-form-control>
      <nz-form-label nzNoColon [nzFor]="resolvedControlId()">{{ label() }}</nz-form-label>
    </nz-form-item>
  `,
  styleUrl: './widget-settings-switch.less',
  host: {
    '(focusout)': 'markAsTouched()',
    '[style.display]': "'contents'"
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WidgetSettingsSwitch),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetSettingsSwitch extends WidgetSettingsControlBase<boolean> {
}
