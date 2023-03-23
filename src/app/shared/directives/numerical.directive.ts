import {
  Directive,
  ElementRef,
  HostListener,
  Input
} from '@angular/core';
import { MathHelper } from "../utils/math-helper";

@Directive({
  selector: 'input[atsNumerical]'
})
export class NumericalDirective {

  @Input() step: number = 1;

  constructor(private _el: ElementRef) {
  }

  @HostListener('mousewheel', ['$event']) onMouseWheel(event: WheelEvent) {
    event.stopPropagation();
    event.preventDefault();

    let step = this.step;
    if (event.deltaY < 0) {
      step = -step;
    }

    if (event.shiftKey) {
      step *= 10;
    }

    const value = this.getStepSum(step);
    this._el.nativeElement.value = value > 0 ? value : 0;
  }

  @HostListener('beforeinput', ['$event']) onBeforeInputChange(event: InputEvent) {
    if (!event.data) {
      return;
    }

    let inputSymbol = event.data.replace(/[^0-9.,]/g, '');
    if (this.isInvalidValue(inputSymbol)) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    if (inputSymbol === ',') {
      event.stopPropagation();
      event.preventDefault();
      this._el.nativeElement.value = this._el.nativeElement.value + '.';
      this._el.nativeElement.dispatchEvent(new Event('input'));
    }
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

  private isInvalidValue(newSymbol: string): boolean {
    return !newSymbol || ['.', ','].includes(newSymbol) && (this._el.nativeElement.value.includes('.') || !this._el.nativeElement.value);
  }

  private getStepSum(step: number): number {
    const inputValueNumber = +this._el.nativeElement.value || 0;
    const roundingDecimals = Math.max(MathHelper.getPrecision(step), MathHelper.getPrecision(inputValueNumber));
    return MathHelper.round(inputValueNumber + step, roundingDecimals);
  }
}
