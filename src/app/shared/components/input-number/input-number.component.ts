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

  constructor(private readonly cdr: ChangeDetectorRef) {
    super();
  }

  writeValue(value: number | null): void {
    // update value to prevent value emitting in this.setValue(...)
    this.value = value;
    this.setValue(value);
    this.setDisplayValue(value);
    this.cdr.markForCheck();
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

    this.setDisplayValue(parsedValue);
    this.setValue(newValue);
  }

  processKeydown($event: KeyboardEvent) {
    if (['ArrowDown', 'NumpadSubtract'].includes($event.code)) {
      $event.stopPropagation();
      $event.preventDefault();
      this.stepChange(-1 * ($event.shiftKey ? 10 : 1));
      return;
    }

    if (['ArrowUp', 'NumpadAdd'].includes($event.code)) {
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
    this.inputElement.nativeElement.value = value?.toString() ?? '';
  }

  private stepChange(multiplier: number) {
    const step = (this.step ?? 1) * multiplier;
    const currentValue = this.value ?? 0;

    const roundingDecimals = Math.max(MathHelper.getPrecision(step), MathHelper.getPrecision(currentValue));

    let newValue = MathHelper.round(currentValue + step, roundingDecimals);
    newValue = newValue > 0 ? newValue : 0;

    this.setDisplayValue(newValue);
    this.setValue(newValue);
  }

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
