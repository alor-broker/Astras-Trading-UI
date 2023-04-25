import {Directive, ElementRef, HostListener, Input} from '@angular/core';
import {MathHelper} from "../utils/math-helper";

@Directive({
  selector: 'input[atsNumerical]'
})
export class NumericalDirective {

  @Input() step: number = 1;

  constructor(private _el: ElementRef) {
  }

  @HostListener('wheel', ['$event']) onMouseWheel(event: WheelEvent) {
    event.stopPropagation();
    event.preventDefault();

    let step = this.step;
    if (event.deltaY > 0) {
      step = -step;
    }

    if (event.shiftKey) {
      step *= 10;
    }

    const value = this.getStepSum(step);
    this._el.nativeElement.value = value > 0 ? value : 0;
    this._el.nativeElement.dispatchEvent(new Event('input'));
  }

  @HostListener('beforeinput', ['$event']) onBeforeInputChange(event: InputEvent) {
    if (event.inputType == "deleteContentBackward") {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const rawValue = this.getNewValue(event);
    const newValueStr = this.removeExtraDots(
      rawValue
        .replace(/,/g, '.')
        .replace(/-/g, '')
    );

    let newValue = Number(newValueStr);

    if (Number.isNaN(newValue)) {
      return;
    }

    this._el.nativeElement.value = newValueStr.endsWith('.')
      ? newValueStr
      : newValue.toString();
    this._el.nativeElement.dispatchEvent(new Event('input'));
  }

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    let step = this.step || 1;

    if (event.code === 'ArrowDown') {
      step = -step;
    }

    if (event.code === 'ArrowDown' || event.code === 'ArrowUp') {
      event.stopPropagation();
      event.preventDefault();
      const value = this.getStepSum(step);
      this._el.nativeElement.value = value > 0 ? value : 0;
      this._el.nativeElement.dispatchEvent(new Event('input'));
    }
  }

  private getNewValue(event: InputEvent): string {
    const targetEl = <HTMLInputElement>event.target;
    const selectionStart = targetEl.selectionStart ?? 0;
    const selectionEnd = targetEl.selectionEnd ?? 0;

    const currentValueArr = (this._el.nativeElement.value ?? '').split('');
    currentValueArr.splice(targetEl.selectionStart, selectionEnd - selectionStart, event.data ?? '');

    return currentValueArr.join('');
  }

  private getStepSum(step: number): number {
    const inputValueNumber = +this._el.nativeElement.value || 0;
    const roundingDecimals = Math.max(MathHelper.getPrecision(step), MathHelper.getPrecision(inputValueNumber));
    return MathHelper.round(inputValueNumber + step, roundingDecimals);
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
