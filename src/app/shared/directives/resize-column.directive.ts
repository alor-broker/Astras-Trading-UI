import {
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChange
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  distinctUntilChanged,
  fromEvent,
  Subject,
  switchMap,
  takeUntil
} from 'rxjs';
import {
  finalize,
  map,
  tap
} from 'rxjs/operators';
import { NzThMeasureDirective } from 'ng-zorro-antd/table';

@Directive({
  selector: 'th[atsResizeColumn]'
})
export class ResizeColumnDirective implements OnInit, OnDestroy {
  @Input()
  minWidth = 0;

  @Input()
  atsResizeColumn?: boolean = true;

  @Output()
  atsWidthChanged = new EventEmitter<number>();

  @Output()
  atsWidthChanging = new EventEmitter<{ columnWidth: number, delta: number | null }>();

  private readonly destroy$: Subject<boolean> = new Subject<boolean>();
  private readonly column: HTMLElement;

  constructor(
    private readonly el: ElementRef,
    private readonly renderer: Renderer2,
    private readonly dir: NzThMeasureDirective,
    @Inject(DOCUMENT)
    private readonly documentRef: Document,
    private readonly ngZone: NgZone) {
    this.column = this.el.nativeElement;
  }

  ngOnInit(): void {
    if (!this.atsResizeColumn) {
      return;
    }

    const resizer = this.renderer.createElement("span");
    this.renderer.addClass(resizer, "resize-holder");
    this.renderer.appendChild(this.column, resizer);

    fromEvent<MouseEvent>(resizer, 'click').pipe(
      takeUntil(this.destroy$)
    ).subscribe((e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.ngZone.runOutsideAngular(() => {
      fromEvent<MouseEvent>(resizer, 'mousedown').pipe(
        tap(e => {
          e.preventDefault();
          e.stopPropagation();
        }),
        switchMap(() => {
          const { width, right } = this.column.getBoundingClientRect();

          return fromEvent<MouseEvent>(this.documentRef, 'mousemove').pipe(
            tap(e => {
              e.preventDefault();
              e.stopPropagation();
            }),
            map(({ clientX }) => width + clientX - right),
            map(w => Math.round(w)),
            map(w => w > 0 && w >= this.minWidth ? w : this.minWidth),
            distinctUntilChanged(),
            takeUntil(fromEvent(this.documentRef, 'mouseup')),
            finalize(() => {
              const lastWidth = Number(this.dir.nzWidth?.replace('px', ''));
              this.atsWidthChanged.emit(lastWidth);
            })
          );
        }),
        takeUntil(this.destroy$)
      ).subscribe(w => {
          this.ngZone.run(() => {
            const prev = this.dir.nzWidth;
            this.dir.nzWidth = `${w}px`;
            this.dir.ngOnChanges({
                nzWidth: new SimpleChange(prev, this.dir.nzWidth, prev != null)
              }
            );

            this.atsWidthChanging.emit({
              columnWidth: w,
              delta: !!prev
                ? (w -  Number(prev.replace('px', '')))
                : null
            });
          });
        }
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
