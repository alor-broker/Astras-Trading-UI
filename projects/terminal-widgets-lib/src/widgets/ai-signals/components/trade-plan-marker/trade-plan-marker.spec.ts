import {TestBed} from '@angular/core/testing';
import {TradePlanLevel} from '../../types/trade-plan-level.types';
import {TradePlanMarker} from './trade-plan-marker';

describe('TradePlanMarker', () => {
  it.each([
    [TradePlanLevel.CurrentPrice, false],
    [TradePlanLevel.EntryPrice, true],
    [TradePlanLevel.StopLoss, false],
    [TradePlanLevel.TakeProfit1, true],
    [TradePlanLevel.TakeProfit2, true]
  ])('should render the %s chart marker with the appropriate outline', (level, outlined) => {
    const fixture = TestBed.createComponent(TradePlanMarker);
    fixture.componentRef.setInput('level', level);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.dataset['level']).toBe(level);
    expect(element.classList.contains('outlined')).toBe(outlined);
    expect(element.querySelectorAll('.marker-dot')).toHaveLength(1);
    expect(element.getAttribute('aria-hidden')).toBe('true');
  });

  it.each(Object.values(TradePlanLevel))('should render the %s legend marker without an outline', level => {
    const fixture = TestBed.createComponent(TradePlanMarker);
    fixture.componentRef.setInput('level', level);
    fixture.componentRef.setInput('legend', true);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.dataset['level']).toBe(level);
    expect(element.classList.contains('legend')).toBe(true);
    expect(element.classList.contains('outlined')).toBe(false);
    expect(element.querySelectorAll('.marker-dot')).toHaveLength(1);
  });

  it('should update the outline when the marker switches to legend mode', () => {
    const fixture = TestBed.createComponent(TradePlanMarker);
    fixture.componentRef.setInput('level', TradePlanLevel.EntryPrice);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.classList.contains('outlined')).toBe(true);

    fixture.componentRef.setInput('legend', true);
    fixture.detectChanges();

    expect(element.classList.contains('outlined')).toBe(false);
    expect(element.classList.contains('legend')).toBe(true);
  });
});
