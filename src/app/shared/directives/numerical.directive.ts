import {
  Directive,
  ElementRef,
  HostListener,
  Input
} from '@angular/core';
import { MathHelper } from "../utils/math-helper";
import {LoggerService} from "../services/logging/logger.service";

@Directive({
  selector: 'input[atsNumerical]'
})
export class NumericalDirective {

  @Input() step: number = 1;

  constructor(
    private readonly _el: ElementRef,
    private readonly logger: LoggerService
  ) {
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
    this.logger.info(`beforeinput event data: ${event.data}`);
    this.logger.info(`beforeinput value: ${this._el.nativeElement.value}`);

    if (!event.data) {
      return;
    }

    if (event.data.length > 1) {
      const selectionStart = (<HTMLInputElement>event.target).selectionStart!;
      const selectionTotal = (<HTMLInputElement>event.target).selectionEnd! - selectionStart;

      let newValue = (this._el.nativeElement.value ?? '').split('');
      newValue.splice((<HTMLInputElement>event.target).selectionStart, selectionTotal, event.data);
      newValue = newValue.join('');
      newValue = newValue.replace(/,/g, '.');

      event.stopPropagation();
      event.preventDefault();
      if (isNaN(newValue)) {
        return;
      }

      this._el.nativeElement.value = newValue;
      this.logger.info(`beforeinput newValue: ${newValue}`);
      this._el.nativeElement.dispatchEvent(new Event('input'));

      return;
    }

    let inputSymbol = event.data.replace(/[^0-9.,]/g, '');
    if (this.isInvalidValue(inputSymbol)) {
      this.logger.info(`beforeinput isInvalidValue`);
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    if (inputSymbol === ',') {
      event.stopPropagation();
      event.preventDefault();
      this.logger.info(`beforeinput add point`);
      this._el.nativeElement.value = this._el.nativeElement.value + '.';
      this.logger.info(`beforeinput newValue: ${this._el.nativeElement.value}`);
      this._el.nativeElement.dispatchEvent(new Event('input'));
    }
  }

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    this.logger.info(`keydown: ${event.code}`);
    this.logger.info(`keydown value: ${this._el.nativeElement.value}`);

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
