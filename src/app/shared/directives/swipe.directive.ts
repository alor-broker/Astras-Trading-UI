import {
  Directive,
  HostListener,
  output
} from '@angular/core';

@Directive({
  selector: '[atsSwipe]'
})
export class SwipeDirective {
  swipeLeft = output<void>();
  swipeRight = output<void>();

  private touchStartX = 0;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    if (deltaX > 50) this.swipeRight.emit();
    if (deltaX < -50) this.swipeLeft.emit();
  }
}
