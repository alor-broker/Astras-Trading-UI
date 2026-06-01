import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewEncapsulation
} from '@angular/core';
import {Subject} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  PANEL_RESIZE_CONTEXT,
  PanelResizeContext,
  PANELS_CONTAINER_CONTEXT,
  PanelsContainerContext
} from "../tokens";
import {PanelResizeHandler} from '@terminal-widgets-lib/widgets/scalper-order-book/components/panels/panel-resize-handler/panel-resize-handler';
import {ResizedEvent} from '@terminal-widgets-lib/widgets/scalper-order-book/components/panels/panels-container/panels-container';

@Component({
  selector: 'ats-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.less'],
  providers: [
    {
      provide: PANEL_RESIZE_CONTEXT,
      useExisting: Panel
    }
  ],
  host: {
    '(dblclick)': 'expand()'
  },
  imports: [PanelResizeHandler],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class Panel implements PanelResizeContext, OnInit, OnDestroy {
  readonly resizeEndOutsideAngular$ = new Subject<void>();

  readonly canResize = input(false);

  readonly id = input.required<string>();

  readonly defaultWidthPercent = input.required<number>();

  readonly minWidthPx = input(5);

  readonly expandable = input(false);

  readonly resizedOutsideAngular$ = new Subject<ResizedEvent>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly panelsContainerContext = inject<PanelsContainerContext>(PANELS_CONTAINER_CONTEXT, {skipSelf: true});

  private readonly renderer = inject(Renderer2);

  private readonly destroyRef = inject(DestroyRef);

  private expanded = false;

  get isExpanded(): boolean {
    return this.expanded;
  }

  ngOnDestroy(): void {
    this.resizedOutsideAngular$.complete();
  }

  ngOnInit(): void {
    this.resizedOutsideAngular$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      this.expanded = false;
      this.panelsContainerContext.onPanelResized(this, event);
    });

    this.resizeEndOutsideAngular$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.panelsContainerContext.onPanelResizeCompleted();
    });
  }

  applyWidth(width: number, units = '%'): void {
    this.renderer.setStyle(this.host.nativeElement, 'width', `${width}${units}`);
  }

  getCurrentBounds(): DOMRect {
    return this.host.nativeElement.getBoundingClientRect();
  }

  expand(): void {
    if (!this.expandable()) {
      return;
    }

    if (!this.expanded) {
      this.panelsContainerContext.expandPanel(this);
    } else {
      this.panelsContainerContext.restore();
    }

    this.expanded = !this.expanded;
  }
}
