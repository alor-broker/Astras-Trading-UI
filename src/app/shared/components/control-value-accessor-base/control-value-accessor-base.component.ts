import { ControlValueAccessor } from '@angular/forms';

export abstract class ControlValueAccessorBaseComponent<T> implements ControlValueAccessor {

  protected constructor() {
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onValueChanged = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  abstract writeValue(value: T | null): void;

  protected emitValue(value: T | null) {
    this.onValueChanged(value);
  }

  protected checkIfTouched() {
    if (this.needMarkTouched()) {
      this.onTouched();
    }
  }

  protected abstract needMarkTouched(): boolean;

  private onValueChanged: (value: T | null) => void = () => {
  };

  private onTouched = () => {
  };

}
