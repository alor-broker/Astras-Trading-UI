import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
    selector: '[atsScrollableItem]'
})
export class ScrollableItemDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  getElementRef(): ElementRef<HTMLElement> {
    return this.elementRef;
  }
}
