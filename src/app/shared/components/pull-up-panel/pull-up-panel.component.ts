import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  OnDestroy,
  Renderer2,
  signal,
  TemplateRef,
  viewChild
} from '@angular/core';
import {NgTemplateOutlet} from "@angular/common";

@Component({
  selector: 'ats-pull-up-panel',
  templateUrl: './pull-up-panel.component.html',
  styleUrl: './pull-up-panel.component.less',
  imports: [
    NgTemplateOutlet
  ],
  host: {
    '[class.expanded]': 'isExpanded()',
    '[style.transition-duration.s]': 'currentTransitionDuration()',
    '[style.--header-height.px]': 'headerHeight()'
  }
})
export class PullUpPanelComponent implements AfterViewInit, OnDestroy {
  readonly header = input.required<TemplateRef<any>>();

  readonly body = input.required<TemplateRef<any>>();

  readonly triggerMode = input<'click' | 'drag'>('click');

  readonly animationDurationSec = input(0.3);

  readonly dragThresholdPx = input(50);

  readonly isExpanded = model(false);

  protected readonly headerContainer = viewChild.required<ElementRef<HTMLElement>>('headerContainer');

  protected readonly headerHeight = signal(0);

  private readonly isDragging = signal(false);

  protected readonly currentTransitionDuration = computed(() => this.isDragging() ? 0 : this.animationDurationSec());

  private resizeObserver: ResizeObserver | null = null;

  private startY = 0;

  private wasDragging = false;

  private readonly elementRef = inject(ElementRef) as ElementRef<HTMLElement>;

  private readonly renderer = inject(Renderer2);

  ngAfterViewInit(): void {
    const headerEl = this.headerContainer().nativeElement;
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.headerHeight.set(entry.contentRect.height);
      }
    });
    this.resizeObserver.observe(headerEl);

    this.headerHeight.set(headerEl.offsetHeight);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  toggle(): void {
    this.isExpanded.update(v => !v);
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onDocumentPointerMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging()) return;

    const clientY = this.getClientY(event);
    const delta = this.startY - clientY;

    if (Math.abs(delta) > 5) {
      this.wasDragging = true;
    }

    const hostHeight = this.elementRef.nativeElement.offsetHeight;
    const baseOffset = this.isExpanded() ? hostHeight : this.headerHeight();

    let newOffset = baseOffset + delta;
    newOffset = Math.max(this.headerHeight(), Math.min(hostHeight, newOffset));

    const translateY = hostHeight - newOffset;

    this.renderer.setStyle(this.elementRef.nativeElement, 'transform', `translateY(${translateY}px)`);
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onDocumentPointerUp(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging()) return;

    const clientY = this.getClientY(event);
    const delta = this.startY - clientY;

    if (Math.abs(delta) > this.dragThresholdPx()) {
      if (delta > 0 && !this.isExpanded()) {
        this.open();
      } else if (delta < 0 && this.isExpanded()) {
        this.close();
      }
    }

    this.isDragging.set(false);
    setTimeout(() => {
      this.renderer.removeStyle(this.elementRef.nativeElement, 'transform');
    });
  }

  protected onHeaderClick(): void {
    if (this.wasDragging) {
      this.wasDragging = false;
      return;
    }
    if (this.triggerMode() === 'click') {
      this.toggle();
    }
  }

  protected onHeaderPointerDown(event: MouseEvent | TouchEvent): void {
    if (this.triggerMode() !== 'drag') return;

    this.isDragging.set(true);
    this.wasDragging = false;
    this.startY = this.getClientY(event);
  }

  private open(): void {
    this.isExpanded.set(true);
  }

  private close(): void {
    this.isExpanded.set(false);
  }

  private getClientY(event: MouseEvent | TouchEvent): number {
    return (event instanceof MouseEvent) ? event.clientY : event.changedTouches[0].clientY;
  }
}
