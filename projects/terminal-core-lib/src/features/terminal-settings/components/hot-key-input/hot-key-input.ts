import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import {HotKeyMeta} from '../../terminal-settings.types';
import {ControlValueAccessorBase} from '../../../forms/components/control-value-accessor-base';
import {NzFormModule} from 'ng-zorro-antd/form';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzInputDirective} from 'ng-zorro-antd/input';

@Component({
  selector: 'ats-hot-key-input',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzInputDirective,
    NzFormModule
  ],
  templateUrl: './hot-key-input.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HotKeyInput),
      multi: true
    }
  ],
})
export class HotKeyInput extends ControlValueAccessorBase<HotKeyMeta> {
  readonly actionName = input.required<string>();

  value: HotKeyMeta | null = null;

  private readonly formBuilder = inject(FormBuilder);

  readonly control = this.formBuilder.nonNullable.control<string | null>(null);

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
