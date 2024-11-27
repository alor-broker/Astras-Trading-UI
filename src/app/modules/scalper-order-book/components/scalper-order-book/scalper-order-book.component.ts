import {
  Component,
  InjectionToken,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  shareReplay
} from 'rxjs';
import { map } from "rxjs/operators";
import { ScalperOrderBookDataProvider } from "../../services/scalper-order-book-data-provider.service";

export interface ScalperOrderBookSharedContext {
  readonly workingVolume$: Observable<number | null>;
  gridSettings$: Observable<{ rowHeight: number, fontSize: number }>;
  readonly scaleFactor$: Observable<number>;

  setWorkingVolume(value: number): void;

  setScaleFactor(value: number): void;
}

export const SCALPER_ORDERBOOK_SHARED_CONTEXT = new InjectionToken<ScalperOrderBookSharedContext>('ScalperOrderBookSharedContext');

@Component({
  selector: 'ats-scalper-order-book',
  templateUrl: './scalper-order-book.component.html',
  styleUrls: ['./scalper-order-book.component.less'],
  providers: [
    {
      provide: SCALPER_ORDERBOOK_SHARED_CONTEXT,
      useExisting: ScalperOrderBookComponent
    }
  ]
})
export class ScalperOrderBookComponent implements ScalperOrderBookSharedContext, OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;

  @Input()
  isActive = false;

  workingVolume$ = new BehaviorSubject<number>(1);
  scaleFactor$ = new BehaviorSubject<number>(1);

  gridSettings$!: Observable<{ rowHeight: number, fontSize: number }>;

  hideTooltips$!: Observable<boolean>;

  constructor(private readonly dataContextService: ScalperOrderBookDataProvider) {
  }

  setScaleFactor(value: number): void {
    this.scaleFactor$.next(value);
  }

  ngOnInit(): void {
    const settings$ = this.dataContextService.getSettingsStream(this.guid).pipe(
      map(s => s.widgetSettings),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.gridSettings$ = settings$.pipe(
      map(s => ({
          rowHeight: s.rowHeight ?? 18,
          fontSize: s.fontSize ?? 12
        })
      ),
      distinctUntilChanged((prev, curr) => prev.fontSize === curr.fontSize && prev.rowHeight === curr.rowHeight),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.hideTooltips$ = settings$
      .pipe(
        map(s => s.hideTooltips ?? false)
      );
  }

  setWorkingVolume(value: number): void {
    this.workingVolume$.next(value);
  }

  ngOnDestroy(): void {
    this.workingVolume$.complete();
    this.scaleFactor$.complete();
  }
}
