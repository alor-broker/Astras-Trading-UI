import { ChangeDetectorRef, Component, DestroyRef, ElementRef, forwardRef, input, TemplateRef, output, viewChild, inject } from '@angular/core';
import {FormsModule, NG_VALUE_ACCESSOR} from "@angular/forms";
import {ControlValueAccessorBaseComponent} from "../control-value-accessor-base/control-value-accessor-base.component";
import {MathHelper} from "../../utils/math-helper";
import {
  NzInputDirective,
  NzInputSuffixDirective,
  NzInputWrapperComponent
} from "ng-zorro-antd/input";
import {NgTemplateOutlet} from "@angular/common";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {filter} from "rxjs";

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
  imports: [
    NzInputDirective,
    FormsModule,
    NgTemplateOutlet,
    NzInputWrapperComponent,
    NzInputSuffixDirective
  ]
})
export class InputNumberComponent extends ControlValueAccessorBaseComponent<number> {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = input(1);
  readonly placeholder = input('');
  readonly readonly = input(false);
  readonly allowNegative = input(false);
  readonly suffix = input<TemplateRef<any> | null>(null);
  readonly focused = input(false);
  readonly allowDecimal = input(true);
  readonly initialValue = input<number>();
  readonly allowClear = input(true);

  readonly atsBlur = output();

  readonly atsEnter = output();

  readonly valueChanged = output<number | null>();

  readonly inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputElement');

  value?: number | null;

  displayValue?: string | null;
  private readonly minus = '-';

  constructor() {
    super();
    const destroyRef = this.destroyRef;

    toObservable(this.initialValue).pipe(
      filter((value) => value != undefined),
      takeUntilDestroyed(destroyRef)
    ).subscribe((value) => this.writeValue(value));
  }

  writeValue(value: number | null): void {
    if (value === this.value) {
      return;
    }

    if (Number(this.displayValue) === Number(value)) {
      return;
    }

    // update value to prevent value emitting in this.setValue(...)
    this.value = value;
    this.setValue(value);

    this.setDisplayValue(value);
    if (this.focused()) {
      setTimeout(() => {
        this.inputElement()?.nativeElement.select();
      });
    }

    this.cdr.markForCheck();
  }

  setValue(value: number | null): void {
    if (this.value !== value) {
      this.value = value;
      this.emitValue(value);
      this.valueChanged.emit(value);
    }
  }

  onModelChange(value: string): void {
    let parsedValue = value
      .trim()
      .replace(/,/g, '.')
      .replace(/[^\d.-]/g, '');

    parsedValue = this.removeExtraSymbol('.', parsedValue);

    if (this.allowNegative()) {
      parsedValue = this.removeExtraSign(parsedValue);
    } else {
      parsedValue = parsedValue.replace(/-/g, '');
    }

    if (!this.allowDecimal()) {
      parsedValue = parsedValue.replace(/\./g, '');
    }

    let newValue: number | null = parsedValue.length > 0
      ? Number(parsedValue)
      : null;

    if (parsedValue === this.minus && this.allowNegative()) {
      newValue = null;
    } else if (newValue != null && Number.isNaN(newValue)) {
      newValue = this.value ?? null;
      parsedValue = '';
    }

    this.setDisplayValue(parsedValue);
    this.setValue(newValue);
  }

  processKeydown($event: KeyboardEvent): void {
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

  processWheel(event: WheelEvent): void {
    if (event.target !== document.activeElement) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    let multiplier = event.deltaY > 0 ? -1 : 1;
    if (event.shiftKey) {
      multiplier = multiplier * 10;
    }

    this.stepChange(multiplier);
  }

  protected needMarkTouched(): boolean {
    return true;
  }

  private setDisplayValue(value: number | string | null): void {
    this.displayValue = value?.toString() ?? '';
    this.inputElement().nativeElement.value = this.displayValue;
  }

  private stepChange(multiplier: number): void {
    const valueStep = this.step() || 1;
    const move = valueStep * multiplier;
    const currentValue = this.value ?? 0;

    let newValue = MathHelper.roundByMinStepMultiplicity(currentValue + move, valueStep);
    newValue = (newValue > 0 || this.allowNegative()) ? newValue : 0;

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
    if (input.startsWith(this.minus)) {
      startSymbol = this.minus;
    }

    return startSymbol + input.replace(/-/g, '');
  }
}
