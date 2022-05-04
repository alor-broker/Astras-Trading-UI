import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, Observable, of, tap } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';

@Component({
  selector: 'ats-help-widget',
  templateUrl: './help-widget.component.html',
  styleUrls: ['./help-widget.component.less']
})
export class HelpWidgetComponent implements OnInit, OnDestroy {
  readonly defaultWindowSize: string = '70%';
  readonly minWindowSize: number = 1000;
  isVisible$: Observable<boolean> = of(false);
  helpParams$?: Observable<string>;
  windowSize$ = new BehaviorSubject<string | number>(this.defaultWindowSize);
  resizeObserver?: ResizeObserver;
  private params?: string;

  constructor(public modal: ModalService) {
  }

  ngOnInit() {
    this.helpParams$ = this.modal.helpParams$.pipe(
      filter((p): p is string => !!p),
      tap(p => this.params = p)
    );
    this.isVisible$ = this.modal.shouldShowHelpModal$;

    this.initWindowResize();
  }

  handleClose() {
    this.modal.closeHelpModal();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.windowSize$.complete();
  }

  private initWindowResize() {
    this.resizeObserver = new ResizeObserver(entries => {
        entries.forEach(value => {
          const width = value.contentRect.width > this.minWindowSize
            ? this.defaultWindowSize
            : this.minWindowSize;

          this.windowSize$.next(width);
        });
      }
    );

    this.resizeObserver.observe(document.body);
  }
}
