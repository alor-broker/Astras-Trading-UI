import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
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
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {AsyncPipe} from '@angular/common';
import {ScalperOrderBookDataContext} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';
import {
  InstrumentEqualityComparer,
  InstrumentKeyHelper
} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {EvaluationService} from '@terminal-core-lib/features/orders/services/evaluation.service';
import {Evaluation} from '@terminal-core-lib/features/orders/services/evaluation-service.types';

@Component({
  selector: 'ats-short-long-indicator',
  templateUrl: './short-long-indicator.html',
  styleUrls: ['./short-long-indicator.less'],
  imports: [
    TranslocoDirective,
    LetDirective,
    NzTooltipDirective,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ShortLongIndicator implements OnInit, OnDestroy {
  readonly dataContext = input.required<ScalperOrderBookDataContext>();

  readonly hideTooltips = input(false);

  readonly orientation = input<'vertical' | 'horizontal'>('vertical');

  shortLongValues$ = new BehaviorSubject<{ short: number, long: number } | null>(null);

  private readonly evaluationService = inject(EvaluationService);

  private readonly destroyRef = inject(DestroyRef);

  ngOnDestroy(): void {
    this.shortLongValues$.complete();
  }

  ngOnInit(): void {
    const widgetSettings$ = this.dataContext().extendedSettings$.pipe(
      map(s => s.widgetSettings),
      distinctUntilChanged((prev, curr) => InstrumentEqualityComparer.equals(prev, curr)),
      shareReplay({bufferSize: 1, refCount: true})
    );

    const instrumentKey$ = widgetSettings$.pipe(
      map(s => InstrumentKeyHelper.toInstrumentKey(s)),
      tap(() => this.shortLongValues$.next(null)),
      shareReplay({bufferSize: 1, refCount: true})
    );

    const updateInterval$ = widgetSettings$.pipe(
      map(s => s.shortLongIndicatorsUpdateIntervalSec ?? 60),
      distinct(),
      shareReplay({bufferSize: 1, refCount: true})
    );

    const currentOrders$ = this.dataContext().currentOrders$.pipe(
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
        orderBook: this.dataContext().orderBook$,
        portfolioKey: this.dataContext().currentPortfolio$
      }).pipe(
        filter(x => InstrumentEqualityComparer.equals(x.instrumentKey, x.orderBook.instrumentKey)),
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
