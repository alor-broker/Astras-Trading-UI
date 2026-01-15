import { Component, DestroyRef, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, input, inject } from '@angular/core';
import { Subject } from "rxjs";
import { ResizedEvent } from "../panels-container/panels-container.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  PANEL_RESIZE_CONTEXT,
  PanelResizeContext,
  PANELS_CONTAINER_CONTEXT,
  PanelsContainerContext
} from "../tokens";
import { PanelResizeHandlerComponent } from '../panel-resize-handler/panel-resize-handler.component';

@Component({
    selector: 'ats-panel',
    templateUrl: './panel.component.html',
    styleUrls: ['./panel.component.less'],
    providers: [
        {
            provide: PANEL_RESIZE_CONTEXT,
            useExisting: PanelComponent
        }
    ],
    imports: [PanelResizeHandlerComponent]
})
export class PanelComponent implements PanelResizeContext, OnInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly panelsContainerContext = inject<PanelsContainerContext>(PANELS_CONTAINER_CONTEXT, { skipSelf: true });
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  readonly resizeEndOutsideAngular$ = new Subject<void>();
  readonly canResize = input(false);

  readonly id = input.required<string>();

  readonly defaultWidthPercent = input.required<number>();

  readonly minWidthPx = input(5);

  readonly expandable = input(false);

  readonly resizedOutsideAngular$ = new Subject<ResizedEvent>();
  private expanded = false;

  ngOnDestroy(): void {
    this.resizedOutsideAngular$.complete();
  }

  get isExpanded(): boolean {
    return this.expanded;
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

  @HostListener('dblclick')
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
