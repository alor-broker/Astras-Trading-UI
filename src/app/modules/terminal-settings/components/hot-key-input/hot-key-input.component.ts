import { Component, Input } from '@angular/core';
import {
  ControlValueAccessorBaseComponent
} from "../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component";
import { HotKeyMeta } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import { NG_VALUE_ACCESSOR, UntypedFormControl } from "@angular/forms";

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
  ]
})
export class HotKeyInputComponent extends ControlValueAccessorBaseComponent<HotKeyMeta> {

  @Input({required: true})
  actionName!: string;

  @Input()
  isNotUniqueError = false;

  control = new UntypedFormControl(null);

  value: HotKeyMeta | null = null;

  writeValue(value: HotKeyMeta | string | null): void {
    if (value != null && value !== '') {
      if (typeof value === 'string') {
        this.control.setValue(value);
        this.value = {
          key: value,
          code: '',
          shiftKey: true
        };
      } else {
        this.control.setValue(value.key);
        this.value = value;
      }
    } else {
      this.control.reset();
    }
  }

  hotkeyChange(e: KeyboardEvent): void {
    if (e.code === 'Backspace') {
      this.value = null;
      this.control.reset();
    } else {
      this.value = {
        key: e.key,
        code: e.code,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey || e.metaKey,
        altKey: e.altKey
      };
      this.control.setValue(e.key);
    }

    this.emitValue(this.value);
  }

  protected needMarkTouched(): boolean {
    return this.control.touched;
  }
}
