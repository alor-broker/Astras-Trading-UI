import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';

@Component({
  selector: 'ats-expandable-text',
  imports: [
    NgTemplateOutlet,
    NzButtonComponent
  ],
  templateUrl: './expandable-text.html',
  styleUrl: './expandable-text.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--ats-expandable-text-rows]': 'rows()'
  }
})
export class ExpandableTextComponent {
  readonly rows = input(3);

  readonly expandButtonTemplate = input.required<TemplateRef<void>>();

  readonly expanded = signal(false);

  readonly isOverflowing = signal(false);

  private readonly contentRef = viewChild.required<ElementRef<HTMLElement>>('content');

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.updateOverflowState();

      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const resizeObserver = new ResizeObserver(() => this.updateOverflowState());
      resizeObserver.observe(this.contentRef().nativeElement);

      this.destroyRef.onDestroy(() => resizeObserver.disconnect());
    });
  }

  expand(): void {
    this.expanded.set(true);
    this.isOverflowing.set(false);
  }

  updateOverflowState(): void {
    if (this.expanded()) {
      this.isOverflowing.set(false);
      return;
    }

    const contentElement = this.contentRef().nativeElement;
    this.isOverflowing.set(contentElement.scrollHeight > contentElement.clientHeight + 1);
  }
}
