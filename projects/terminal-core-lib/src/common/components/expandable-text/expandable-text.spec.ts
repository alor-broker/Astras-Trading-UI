import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';
import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {ExpandableTextComponent} from './expandable-text';

@Component({
  selector: 'ats-expandable-text-host',
  imports: [
    ExpandableTextComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ats-expandable-text
      [expandButtonTemplate]="expandButton"
      [rows]="rows"
    >
      <span class="projected-content">{{ text }}</span>
    </ats-expandable-text>

    <ng-template #expandButton>
      <span class="button-content">{{ buttonText }}</span>
    </ng-template>
  `
})
class ExpandableTextHostComponent {
  rows = 3;

  text = 'Projected text';

  buttonText = 'Show more';
}

describe('ExpandableTextComponent', () => {
  function createComponent(): {
    fixture: ComponentFixture<ExpandableTextHostComponent>;
    element: HTMLElement;
    component: ExpandableTextComponent;
  } {
    const fixture = TestBed.createComponent(ExpandableTextHostComponent);
    fixture.detectChanges();

    return {
      fixture,
      element: fixture.nativeElement as HTMLElement,
      component: fixture.debugElement.query(By.directive(ExpandableTextComponent)).componentInstance as ExpandableTextComponent
    };
  }

  function setContentSize(element: HTMLElement, scrollHeight: number, clientHeight: number): void {
    Object.defineProperty(element, 'scrollHeight', {
      configurable: true,
      value: scrollHeight
    });

    Object.defineProperty(element, 'clientHeight', {
      configurable: true,
      value: clientHeight
    });
  }

  it('should render projected content', () => {
    const {element} = createComponent();

    expect(element.querySelector('.projected-content')?.textContent?.trim()).toBe('Projected text');
  });

  it('should not render expand button when content does not overflow', () => {
    const {fixture, component, element} = createComponent();
    const contentElement = element.querySelector('.content') as HTMLElement;
    setContentSize(contentElement, 60, 60);

    component.updateOverflowState();
    fixture.detectChanges();

    expect(element.querySelector('.expand-button')).toBeNull();
  });

  it('should render expand button with provided template when content overflows', () => {
    const {fixture, component, element} = createComponent();
    const contentElement = element.querySelector('.content') as HTMLElement;
    setContentSize(contentElement, 80, 60);

    component.updateOverflowState();
    fixture.detectChanges();

    expect(element.querySelector('.expand-button')).not.toBeNull();
    expect(element.querySelector('.button-content')?.textContent?.trim()).toBe('Show more');
  });

  it('should expand content and hide expand button after button click', () => {
    const {fixture, component, element} = createComponent();
    const contentElement = element.querySelector('.content') as HTMLElement;
    setContentSize(contentElement, 80, 60);
    component.updateOverflowState();
    fixture.detectChanges();

    (element.querySelector('.expand-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(contentElement.classList).toContain('expanded');
    expect(element.querySelector('.expand-button')).toBeNull();
  });
});
