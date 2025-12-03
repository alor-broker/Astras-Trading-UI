import {
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  NgZone,
  OnInit,
  SkipSelf,
  DOCUMENT
} from '@angular/core';
import {
  fromEvent,
  switchMap,
  takeUntil
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  finalize,
  tap
} from "rxjs/operators";

import {
  PANEL_RESIZE_CONTEXT,
  PanelResizeContext
} from "../tokens";

@Component({
    selector: 'ats-panel-resize-handler',
    templateUrl: './panel-resize-handler.component.html',
    styleUrls: ['./panel-resize-handler.component.less'],
    standalone: false
})
export class PanelResizeHandlerComponent implements OnInit {
  constructor(
    private readonly host: ElementRef<HTMLElement>,
    @Inject(PANEL_RESIZE_CONTEXT)
    @SkipSelf()
    private readonly panelResizeContext: PanelResizeContext,
    private readonly ngZone: NgZone,
    @Inject(DOCUMENT)
    private readonly documentRef: Document,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    fromEvent<MouseEvent>(this.host.nativeElement, 'click').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.ngZone.runOutsideAngular(() => {
      fromEvent<MouseEvent>(this.host.nativeElement, 'mousedown').pipe(
        tap(e => {
          e.preventDefault();
          e.stopPropagation();
        }),
        switchMap(() => {
          return fromEvent<MouseEvent>(this.documentRef, 'mousemove').pipe(
            tap(e => {
              e.preventDefault();
              e.stopPropagation();
            }),
            takeUntil(fromEvent(this.documentRef, 'mouseup')),
            finalize(() => {
              this.panelResizeContext.resizeEndOutsideAngular$.next();
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(event => {
        this.panelResizeContext.resizedOutsideAngular$.next({
          clientX: event.clientX
        });
      });
    });
  }
}
