import {
  Directive,
  inject,
  Injector,
  input,
  OnInit,
  signal
} from '@angular/core';
import {NgControl} from '@angular/forms';
import {ControlValueAccessorBase} from '@terminal-core-lib/features/forms/components/control-value-accessor-base';

@Directive()
export abstract class WidgetSettingsControlBase<T> extends ControlValueAccessorBase<T> implements OnInit {
  readonly label = input.required<string>();

  readonly controlId = input<string | null>(null);

  protected readonly value = signal<T | null>(null);

  protected readonly disabled = signal(false);

  protected readonly ngControl = signal<NgControl | null>(null);

  protected readonly ngModelOptions = {standalone: true};

  private readonly injector = inject(Injector);

  ngOnInit(): void {
    this.ngControl.set(this.injector.get(NgControl, null, {self: true}));
  }

  writeValue(value: T | null): void {
    this.value.set(value);
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected updateValue(value: T): void {
    this.value.set(value);
    this.emitValue(value);
  }

  protected markAsTouched(): void {
    this.checkIfTouched();
  }

  protected resolvedControlId(): string {
    const explicitId = this.controlId();
    if (explicitId != null) {
      return explicitId;
    }

    const controlName = this.ngControl()?.name;
    return controlName != null ? controlName.toString() : '';
  }

  protected needMarkTouched(): boolean {
    return true;
  }
}
