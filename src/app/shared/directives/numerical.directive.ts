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

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    if (!this._el.nativeElement.value) {
      return;
    }

    const initialValue = this._el.nativeElement.value;
    this._el.nativeElement.value = initialValue.replace(/[^0-9.]/g, '');
    this._el.nativeElement.value = this.removeExtraDots(this._el.nativeElement.value);

    if (initialValue !== this._el.nativeElement.value) {
      event.stopPropagation();
    }

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
