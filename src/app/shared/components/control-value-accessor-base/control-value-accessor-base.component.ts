import { ControlValueAccessor } from '@angular/forms';

export abstract class ControlValueAccessorBaseComponent<T> implements ControlValueAccessor {
  registerOnChange(fn: (value: T | null) => void): void {
    this.onValueChanged = fn;
  }

  registerOnTouched(fn: ((...args: any[]) => any)): void {
    this.onTouched = fn;
  }

  abstract writeValue(value: T | null): void;

  protected emitValue(value: T | null): void {
    this.onValueChanged(value);
  }

  protected checkIfTouched(): void {
    if (this.needMarkTouched()) {
      this.onTouched();
    }
  }

  protected abstract needMarkTouched(): boolean;

  private onValueChanged: (value: T | null) => void = () => {
  };

  private onTouched = (): void => {
  };
}
