import { Component, DestroyRef, ElementRef, NgZone, OnInit, DOCUMENT, inject } from '@angular/core';
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
    styleUrls: ['./panel-resize-handler.component.less']
})
export class PanelResizeHandlerComponent implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly panelResizeContext = inject<PanelResizeContext>(PANEL_RESIZE_CONTEXT, { skipSelf: true });
  private readonly ngZone = inject(NgZone);
  private readonly documentRef = inject<Document>(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

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
