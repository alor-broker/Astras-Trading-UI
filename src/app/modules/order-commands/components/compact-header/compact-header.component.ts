import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {BehaviorSubject, combineLatest, Observable, switchMap} from "rxjs";
import {QuotesService} from "../../../../shared/services/quotes.service";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {filter, map, startWith} from "rxjs/operators";

@Component({
  selector: 'ats-compact-header',
  templateUrl: './compact-header.component.html',
  styleUrls: ['./compact-header.component.less']
})
export class CompactHeaderComponent implements OnInit, OnDestroy {
  @Output()
  priceSelected = new EventEmitter<number>();

  @Output()
  qtySelected = new EventEmitter<number>();

  priceData$!: Observable<{ bid: number, ask: number }>;
  positionInfo$!: Observable<{ abs: number, quantity: number } | null>;

  readonly instrumentKey$ = new BehaviorSubject<InstrumentKey | null>(null);
  readonly portfolioKey$ = new BehaviorSubject<PortfolioKey | null>(null);

  constructor(
    private readonly quotesService: QuotesService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService) {
  }

  @Input({required: true})
  set instrumentKey(value: InstrumentKey) {
    this.instrumentKey$.next(value);
  }

  @Input({required: true})
  set currentPortfolio(value: PortfolioKey) {
    this.portfolioKey$.next(value);
  }

  ngOnDestroy(): void {
    this.instrumentKey$.complete();
    this.portfolioKey$.complete();
  }

  ngOnInit(): void {
    this.priceData$ = this.instrumentKey$.pipe(
      filter((i): i is InstrumentKey => !!i),
      switchMap(i => this.quotesService.getQuotes(i.symbol, i.exchange, i.instrumentGroup)),
      map(x => ({
        bid: x.bid,
        ask: x.ask
      }))
    );

    this.positionInfo$ = combineLatest(
      [
        this.instrumentKey$,
        this.portfolioKey$
      ]
    ).pipe(
      filter(([instrument, portfolio]) => !!instrument && !!portfolio),
      switchMap(([instrument, portfolio]) => this.portfolioSubscriptionsService.getInstrumentPositionSubscription(portfolio!, instrument!)),
      map(p => {
          if (!p) {
            return null;
          }

          return {
            abs: Math.abs(p.qtyTFutureBatch),
            quantity: p.qtyTFutureBatch
          };
        }
      ),
      startWith(null as ({ abs: number, quantity: number } | null))
    );
  }
}
