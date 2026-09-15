import {ChangeDetectionStrategy, Component, signal, ViewEncapsulation} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Overlay} from '@angular/cdk/overlay';
import {FloatingWindowTestingHelper} from '@testing-lib/helpers/floating-window-testing.helper';
import {FloatingWindow} from './floating-window';
import {FloatingWindowService} from '../../services/floating-window.service';
import {FloatingWindowOptions} from '../../types/floating-window.types';

@Component({
  selector: 'ats-declarative-window-test',
  imports: [FloatingWindow],
  template: `<ng-template #content let-data>{{ data }}</ng-template>
    <ats-floating-window [(visible)]="visible" [content]="content" [options]="options()" windowId="declarative"/>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
class DeclarativeWindowTest {
  readonly visible = signal(false);
  readonly options = signal<FloatingWindowOptions<string>>({data: 'first', title: 'Title'});
}

describe('FloatingWindow', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({providers: [
      {provide: Overlay, useValue: FloatingWindowTestingHelper.createOverlay().overlay}
    ]});
  });

  it('should synchronize visibility and update content without creating another window', () => {
    const fixture = TestBed.createComponent(DeclarativeWindowTest);
    const windows = TestBed.inject(FloatingWindowService);
    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
    const ref = windows.get<string>('declarative');
    expect(ref?.data()).toBe('first');

    fixture.componentInstance.options.set({data: 'second', title: 'New title'});
    fixture.detectChanges();
    expect(windows.get('declarative')).toBe(ref);
    expect(ref?.data()).toBe('second');

    ref?.close();
    fixture.detectChanges();
    expect(fixture.componentInstance.visible()).toBe(false);
    expect(windows.get('declarative')).toBeNull();
  });

  it('should close its overlay when the declaring component is destroyed', () => {
    const fixture = TestBed.createComponent(DeclarativeWindowTest);
    const windows = TestBed.inject(FloatingWindowService);
    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
    const ref = windows.get('declarative');

    fixture.destroy();

    expect(ref?.closed()).toBe(true);
    expect(windows.get('declarative')).toBeNull();
  });
});
