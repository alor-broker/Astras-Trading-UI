import {Directive, ElementRef} from '@angular/core';

@Directive({
    selector: '[atsScrollableItem]',
    standalone: false
})
export class ScrollableItemDirective {
  constructor(private readonly elementRef: ElementRef<HTMLElement>) {
  }

  getElementRef(): ElementRef<HTMLElement> {
    return this.elementRef;
  }
}
