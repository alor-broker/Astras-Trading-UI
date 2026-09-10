import {ChangeDetectionStrategy, Component, ViewEncapsulation} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {SignalSection} from './signal-section';

@Component({
  imports: [SignalSection],
  template: '<ats-signal-section title="Opinion" [panel]="panel"><p>Reasoning</p></ats-signal-section>',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class SectionHost {
  panel = true;
}

describe('SignalSection', () => {
  it('should render a heading outside the panel and preserve projected content', () => {
    const fixture = TestBed.createComponent(SectionHost);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const panel = element.querySelector('.section-panel');

    expect(element.querySelector('h3')?.textContent).toBe('Opinion');
    expect(panel?.querySelector('h3')).toBeNull();
    expect(panel?.querySelector('p')?.textContent).toBe('Reasoning');
  });

  it('should remove framing without removing projected content', () => {
    const fixture = TestBed.createComponent(SectionHost);
    fixture.componentInstance.panel = false;
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.section-panel')).toBeNull();
    expect(element.querySelector('.section-content p')?.textContent).toBe('Reasoning');
  });
});
