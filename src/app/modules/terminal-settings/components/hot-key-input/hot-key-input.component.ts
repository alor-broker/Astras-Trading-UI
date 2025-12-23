import { Component, input, inject } from '@angular/core';
import {
  ControlValueAccessorBaseComponent
} from "../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component";
import {HotKeyMeta} from "../../../../shared/models/terminal-settings/terminal-settings.model";
import {FormBuilder, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule} from "@angular/forms";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzFormControlComponent, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzInputDirective} from 'ng-zorro-antd/input';

@Component({
  selector: 'ats-hot-key-input',
  templateUrl: './hot-key-input.component.html',
  styleUrls: ['./hot-key-input.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: HotKeyInputComponent,
      multi: true
    }
  ],
  imports: [
    TranslocoDirective,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzInputDirective,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class HotKeyInputComponent extends ControlValueAccessorBaseComponent<HotKeyMeta> {
  private readonly formBuilder = inject(FormBuilder);

  readonly actionName = input.required<string>();

  readonly control = this.formBuilder.nonNullable.control<string | null>(null);
  value: HotKeyMeta | null = null;

  writeValue(value: HotKeyMeta | null): void {
    this.control.reset();

    if (value != null) {
      this.control.setValue(value.key);
    }

    this.value = value;
  }

  hotkeyChange(e: KeyboardEvent): void {
    if (e.code === 'Backspace') {
      this.value = null;
      this.control.reset();
    } else {
      this.value = {
        key: e.key,
        code: e.code
      };

      if (e.shiftKey) {
        this.value.shiftKey = true;
      }

      if (e.ctrlKey || e.metaKey) {
        this.value.ctrlKey = true;
      }

      if (e.altKey) {
        this.value.altKey = true;
      }

      this.control.setValue(e.key);
    }

    this.emitValue(this.value);
  }

  protected needMarkTouched(): boolean {
    return this.control.touched;
  }
}
