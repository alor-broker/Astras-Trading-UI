import {Component, ElementRef, EventEmitter, forwardRef, Input, Output, ViewChild} from '@angular/core';
import {NG_VALUE_ACCESSOR} from "@angular/forms";
import {ControlValueAccessorBaseComponent} from "../control-value-accessor-base/control-value-accessor-base.component";

@Component({
  selector: 'ats-input-number',
  templateUrl: './input-number.component.html',
  styleUrls: ['./input-number.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputNumberComponent),
      multi: true
    }
  ],
})
export class InputNumberComponent extends ControlValueAccessorBaseComponent<number> {
  @Input()
  step: number = 1;
  @Input()
  placeholder: string = '';
  @Input() readonly: boolean = false;
  @Output()
  atsBlur = new EventEmitter();
  @ViewChild('inputElement', {static: true})
  inputElement!: ElementRef<HTMLInputElement>;
  value?: number | null;

  constructor() {
    super();
  }

  writeValue(value: number | null): void {
    // update value to prevent value emitting in this.setValue(...)
    this.value = value;
    this.setValue(value);
  }

  setValue(value: number | null) {
    if (this.value !== value) {
      this.emitValue(value);
    }

    this.value = value;
  }

  onModelChange(value: string): void {
    let parsedValue = this.removeExtraDots(
      value
        .trim()
        .replace(/,/g, '.')
        .replace(/[^\d.]/g, '')
    );

    let newValue: number | null = parsedValue.length > 0
      ? Number(parsedValue)
      : null;
    if (newValue != null && Number.isNaN(newValue)) {
      newValue = this.value ?? null;
      parsedValue = '';
    }

    this.inputElement.nativeElement.value = parsedValue;
    this.setValue(newValue);
  }

  protected needMarkTouched(): boolean {
    return true;
  }

  /*
    updateDisplayValue(value: number): void {
      const displayValue = isNotNil(this.nzFormatter(value)) ? this.nzFormatter(value) : '';
      this.displayValue = displayValue;
      this.inputElement.nativeElement.value = `${displayValue}`;
    }*/

  private removeExtraDots(input: string): string {
    const dots = [...input].reduce((previousValue: number[], currentValue, currentIndex) => {
        if (currentValue === '.') {
          return [...previousValue, currentIndex];
        }

        return previousValue;
      },
      []
    );

    if (dots.length <= 1) {
      return input;
    }

    let normalizedValue = '';
    if (dots.length > 1) {
      for (let i = 0; i < input.length; i++) {
        if (dots.indexOf(i) > 0) {
          continue;
        }

        normalizedValue += input[i];
      }
    }

    return normalizedValue;
  }
}
