import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { EvaluationService } from "../../../../shared/services/evaluation.service";
import { ScalperOrderBookDataContext } from "../../models/scalper-order-book-data-context.model";
import {
  BehaviorSubject,
  combineLatest,
  defer,
  distinctUntilChanged,
  forkJoin,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
  timer
} from "rxjs";
import {
  distinct,
  filter,
  map,
  startWith
} from "rxjs/operators";
import { Evaluation } from "../../../../shared/models/evaluation.model";
import { isInstrumentEqual } from "../../../../shared/utils/settings-helper";
import { toInstrumentKey } from "../../../../shared/utils/instruments";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-short-long-indicator',
  templateUrl: './short-long-indicator.component.html',
  styleUrls: ['./short-long-indicator.component.less']
})
export class ShortLongIndicatorComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  dataContext!: ScalperOrderBookDataContext;

  @Input()
  hideTooltips = false;

  @Input()
  orientation: 'vertical' | 'horizontal' = 'vertical';

  shortLongValues$ = new BehaviorSubject<{ short: number, long: number } | null>(null);

  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnDestroy(): void {
    this.shortLongValues$.complete();
  }

  ngOnInit(): void {
    const widgetSettings$ = this.dataContext.extendedSettings$.pipe(
      map(s => s.widgetSettings),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const instrumentKey$ = widgetSettings$.pipe(
      map(s => toInstrumentKey(s)),
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev, curr)),
      tap(() => this.shortLongValues$.next(null)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const updateInterval$ = widgetSettings$.pipe(
      map(s => s.shortLongIndicatorsUpdateIntervalSec ?? 60),
      distinct(),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const currentOrders$ = this.dataContext.currentOrders$.pipe(
      startWith([])
    );

    const refreshTrigger$ = combineLatest([
      instrumentKey$,
      currentOrders$
    ]).pipe(
      switchMap(() => updateInterval$),
      switchMap(interval => timer(0, interval * 1000))
    );

    const dataStream$ = defer(() => {
      return combineLatest({
        instrumentKey: instrumentKey$,
        orderBook: this.dataContext.orderBook$,
        portfolioKey: this.dataContext.currentPortfolio$
      }).pipe(
        filter(x => isInstrumentEqual(x.instrumentKey, x.orderBook.instrumentKey)),
        filter(x => x.orderBook.rows.a.length > 0 || x.orderBook.rows.b.length > 0),
        map(x => ({
          instrumentKey: x.instrumentKey,
          orderBookData: x.orderBook.rows,
          portfolioKey: x.portfolioKey
        })),
        take(1)
      );
    });

    refreshTrigger$.pipe(
      switchMap(() => dataStream$),
      switchMap(d => {
        const bestAsk: number | null = d.orderBookData.a[0]?.p ?? d.orderBookData.b[0]?.p ?? null;
        const bestBid: number | null = d.orderBookData.b[0]?.p ?? d.orderBookData.a[0]?.p ?? null;

        if (bestAsk == null || bestBid == null) {
          return of([null, null]);
        }

        const getEvaluation = (price: number): Observable<Evaluation | null> => {
          return this.evaluationService.evaluateOrder({
            instrument: d.instrumentKey,
            portfolio: d.portfolioKey.portfolio,
            price,
            lotQuantity: 1
          });
        };

        return forkJoin([getEvaluation(bestAsk), getEvaluation(bestBid)]);
      }),
      map(([short, long]) => {
        return {
          short: short?.quantityToSell ?? 0,
          long: long?.quantityToBuy ?? 0,
        };
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => this.shortLongValues$.next(value));
  }
}
