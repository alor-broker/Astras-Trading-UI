import {
  Component,
  Input
} from '@angular/core';
import { ControlValueAccessorBaseComponent } from "../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component";
import { HotKeyMeta } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import {
  FormBuilder,
  NG_VALUE_ACCESSOR
} from "@angular/forms";

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

  @Input({ required: true })
  actionName!: string;

  readonly control = this.formBuilder.nonNullable.control<string | null>(null);
  value: HotKeyMeta | null = null;

  constructor(private readonly formBuilder: FormBuilder) {
    super();
  }

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
