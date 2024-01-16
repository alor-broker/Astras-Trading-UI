import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnInit,
  Renderer2,
  SkipSelf
} from '@angular/core';
import { Subject } from "rxjs";
import { ResizedEvent } from "../panels-container/panels-container.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  PANEL_RESIZE_CONTEXT,
  PanelResizeContext,
  PANELS_CONTAINER_CONTEXT,
  PanelsContainerContext
} from "../tokens";


@Component({
  selector: 'ats-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.less'],
  providers: [
    {
      provide: PANEL_RESIZE_CONTEXT,
      useExisting: PanelComponent
    }
  ]
})
export class PanelComponent implements PanelResizeContext, OnInit {
  readonly resizeEndOutsideAngular$ = new Subject<void>;
  @Input()
  canResize = false;
  @Input({ required: true })
  id!: string;
  @Input({ required: true })
  defaultWidthPercent!: number;
  @Input()
  minWidthPx = 5;
  @Input()
  expandable = false;
  readonly resizedOutsideAngular$ = new Subject<ResizedEvent>;
  private expanded = false;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    @Inject(PANELS_CONTAINER_CONTEXT)
    @SkipSelf()
    private readonly panelsContainerContext: PanelsContainerContext,
    private readonly renderer: Renderer2,
    private readonly destroyRef: DestroyRef
  ) {
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
    if (!this.expandable) {
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
