import {
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnInit,
  Output,
  Renderer2
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  distinctUntilChanged,
  fromEvent,
  switchMap,
  takeUntil
} from 'rxjs';
import {
  finalize,
  map,
  tap
} from 'rxjs/operators';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Directive({
  selector: '[atsResizable]'
})
export class ResizableDirective implements OnInit {
  @Input()
  minWidth = 0;

  @Output()
  atsWidthChanged = new EventEmitter<number>();

  private readonly targetElement: HTMLElement;

  constructor(
    private readonly el: ElementRef,
    private readonly renderer: Renderer2,
    @Inject(DOCUMENT)
    private readonly documentRef: Document,
    private readonly ngZone: NgZone,
    private readonly destroyRef: DestroyRef) {
    this.targetElement = this.el.nativeElement as HTMLElement;
  }

  ngOnInit(): void {
    const resizer = this.renderer.createElement("span") as HTMLElement;
    this.renderer.addClass(resizer, "resize-holder");
    this.renderer.appendChild(this.targetElement, resizer);

    fromEvent<MouseEvent>(resizer, 'click').pipe(
      takeUntilDestroyed(this.destroyRef)
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
          const { width, right } = this.targetElement.getBoundingClientRect();

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
              const { width } = this.targetElement.getBoundingClientRect();
              this.atsWidthChanged.emit(width);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(w => {
          this.ngZone.run(() => {
            this.targetElement.style.width = `${w}px`;
          });
        }
      );
    });
  }
}
