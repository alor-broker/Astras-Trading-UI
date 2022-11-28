import {
  Directive,
  ElementRef,
  HostListener
} from '@angular/core';

@Directive({
  selector: 'input[atsNumerical]'
})
export class NumericalDirective {

  constructor(private _el: ElementRef) {
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

  isInvalidValue(newSymbol: string): boolean {
    return !newSymbol || ['.', ','].includes(newSymbol) && (this._el.nativeElement.value.includes('.') || !this._el.nativeElement.value);
  }
}
