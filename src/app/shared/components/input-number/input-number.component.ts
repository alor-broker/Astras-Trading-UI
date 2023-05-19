import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import {NG_VALUE_ACCESSOR} from "@angular/forms";
import {ControlValueAccessorBaseComponent} from "../control-value-accessor-base/control-value-accessor-base.component";
import {MathHelper} from "../../utils/math-helper";

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
  private readonly minus = '-';
  @Input()
  step: number = 1;
  @Input()
  placeholder: string = '';
  @Input()
  readonly: boolean = false;
  @Input()
  allowNegative = false;

  @Output()
  atsBlur = new EventEmitter();
  @ViewChild('inputElement', {static: true})
  inputElement!: ElementRef<HTMLInputElement>;
  value?: number | null;
  displayValue?: string | null;

  constructor(private readonly cdr: ChangeDetectorRef) {
    super();
  }

  writeValue(value: number | null): void {
    if(value === this.value) {
      return;
    }

    if(Number(this.displayValue) === Number(value)) {
      return;
    }

    // update value to prevent value emitting in this.setValue(...)
    this.value = value;
    this.setValue(value);

    this.setDisplayValue(value);
    this.cdr.markForCheck();
  }

  setValue(value: number | null) {
    if (this.value !== value) {
      this.value = value;
      this.emitValue(value);
    }
  }

  onModelChange(value: string): void {
    let parsedValue = value
      .trim()
      .replace(/,/g, '.')
      .replace(/[^\d.-]/g, '');

    parsedValue = this.removeExtraSymbol('.', parsedValue);

    if(this.allowNegative) {
      parsedValue = this.removeExtraSign(parsedValue);
    } else {
      parsedValue = parsedValue.replace(/-/g, '');
    }

    let newValue: number | null = parsedValue.length > 0
      ? Number(parsedValue)
      : null;

    if(parsedValue === this.minus && this.allowNegative) {
      newValue = null;
    } else if (newValue != null && Number.isNaN(newValue)) {
      newValue = this.value ?? null;
      parsedValue = '';
    }

    this.setDisplayValue(parsedValue);
    this.setValue(newValue);
  }

  processKeydown($event: KeyboardEvent) {
    if (['ArrowDown'].includes($event.code)) {
      $event.stopPropagation();
      $event.preventDefault();
      this.stepChange(-1 * ($event.shiftKey ? 10 : 1));
      return;
    }

    if (['ArrowUp'].includes($event.code)) {
      $event.stopPropagation();
      $event.preventDefault();
      this.stepChange($event.shiftKey ? 10 : 1);
      return;
    }
  }

  processWheel($event: WheelEvent) {
    $event.stopPropagation();
    $event.preventDefault();

    let multiplier = $event.deltaY > 0 ? -1 : 1;
    if ($event.shiftKey) {
      multiplier = multiplier * 10;
    }

    this.stepChange(multiplier);
  }

  protected needMarkTouched(): boolean {
    return true;
  }

  private setDisplayValue(value: number | string | null) {
    this.displayValue = value?.toString() ?? '';
    this.inputElement.nativeElement.value = this.displayValue;
  }

  private stepChange(multiplier: number) {
    const step = (this.step ?? 1) * multiplier;
    const currentValue = this.value ?? 0;

    const roundingDecimals = Math.max(MathHelper.getPrecision(step), MathHelper.getPrecision(currentValue));

    let newValue = MathHelper.round(currentValue + step, roundingDecimals);
    newValue = (newValue > 0 || this.allowNegative) ? newValue : 0;

    this.setDisplayValue(newValue);
    this.setValue(newValue);
  }

  private removeExtraSymbol(symbol: string, input: string): string {
    const symbolIndexes = [...input].reduce((previousValue: number[], currentValue, currentIndex) => {
        if (currentValue === symbol) {
          return [...previousValue, currentIndex];
        }

        return previousValue;
      },
      []
    );

    if (symbolIndexes.length <= 1) {
      return input;
    }

    let normalizedValue = '';
    if (symbolIndexes.length > 1) {
      for (let i = 0; i < input.length; i++) {
        if (symbolIndexes.indexOf(i) > 0) {
          continue;
        }

        normalizedValue += input[i];
      }
    }

    return normalizedValue;
  }

  private removeExtraSign(input: string): string {
    let startSymbol = '';
    if(input.startsWith(this.minus)) {
      startSymbol = this.minus;
    }

    return startSymbol + input.replace(/-/g, '');
  }
}
