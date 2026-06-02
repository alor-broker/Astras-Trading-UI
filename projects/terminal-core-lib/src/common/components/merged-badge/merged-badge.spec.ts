import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {MergedBadge} from './merged-badge';

describe('MergedBadge', () => {
  function createComponent(): {fixture: ComponentFixture<MergedBadge>, element: HTMLElement} {
    const fixture = TestBed.createComponent(MergedBadge);
    const element = fixture.nativeElement as HTMLElement;

    return {fixture, element};
  }

  it('should not render a badge when there are no colors', () => {
    const {fixture, element} = createComponent();

    fixture.detectChanges();

    expect(element.querySelector('.badge')).toBeNull();
  });

  it('should render a badge sized by the width input', () => {
    const {fixture, element} = createComponent();
    fixture.componentRef.setInput('colors', ['red']);
    fixture.componentRef.setInput('width', 20);

    fixture.detectChanges();

    const badge = element.querySelector('.badge') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.style.width).toBe('20px');
    expect(badge.style.height).toBe('20px');
  });

  describe('getBackgroundStyle', () => {
    it('should use the single color directly as the background', () => {
      const {fixture} = createComponent();
      fixture.componentRef.setInput('colors', ['red']);

      expect(fixture.componentInstance.getBackgroundStyle()).toBe('red');
    });

    it('should build a conic gradient that splits the circle between colors', () => {
      const {fixture} = createComponent();
      fixture.componentRef.setInput('colors', ['red', 'blue']);

      expect(fixture.componentInstance.getBackgroundStyle()).toBe('conic-gradient(red 0deg,red 180deg,blue 180deg)');
    });

    it('should distribute three colors across the circle', () => {
      const {fixture} = createComponent();
      fixture.componentRef.setInput('colors', ['red', 'green', 'blue']);

      // floor(360 / 3) = 120deg per color segment.
      expect(fixture.componentInstance.getBackgroundStyle()).toBe(
        'conic-gradient(red 0deg,red 120deg,green 120deg,green 240deg,blue 240deg)'
      );
    });
  });
});
