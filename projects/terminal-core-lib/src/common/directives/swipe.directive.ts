import {
  Directive,
  output
} from '@angular/core';

@Directive({
  selector: '[atsSwipe]',
  host: {
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)'
  }
})
export class Swipe {
  swipeLeft = output<void>();

  swipeRight = output<void>();

  private touchStartX = 0;

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent): void {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    if (deltaX > 50) this.swipeRight.emit();
    if (deltaX < -50) this.swipeLeft.emit();
  }
}
