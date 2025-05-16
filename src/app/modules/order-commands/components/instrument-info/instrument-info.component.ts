import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {BehaviorSubject, combineLatest, filter, map, Observable, shareReplay, switchMap} from "rxjs";
import { QuotesService } from "../../../../shared/services/quotes.service";
import { startWith } from "rxjs/operators";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { EnvironmentService } from "../../../../shared/services/environment.service";

@Component({
    selector: 'ats-instrument-info',
    templateUrl: './instrument-info.component.html',
    styleUrls: ['./instrument-info.component.less'],
    standalone: false
})
export class InstrumentInfoComponent implements OnInit, OnDestroy {
  viewData$!: Observable<{
    instrumentKey: InstrumentKey;
    position: { abs: number, quantity: number } | null;
    priceData: {
      dayOpen: number;
      prevClose: number;
      dayChange?: number;
      dayChangePerPrice?: number;
      lastPrice: number;
      ask: number;
      bid: number;
      high: number;
      low: number;
    };
  }>;

  iconsUrl = this.environmentService.alorIconsStorageUrl;

  @Output()
  priceSelected = new EventEmitter<number>();

  @Output()
  qtySelected = new EventEmitter<number>();

  private readonly instrumentKey$ = new BehaviorSubject<InstrumentKey | null>(null);
  private readonly portfolioKey$ = new BehaviorSubject<PortfolioKey | null>(null);

  constructor(
    private readonly quoteService: QuotesService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly environmentService: EnvironmentService
  ) {
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
    const instrumentKey$ = this.instrumentKey$
      .pipe(
        filter((i): i is InstrumentKey => !!i),
        shareReplay(1)
      );

    const portfolioKey$ = this.portfolioKey$
      .pipe(
        filter((p): p is PortfolioKey => !!p),
        shareReplay(1)
      );

    const position$ = combineLatest(
      [
        instrumentKey$,
        portfolioKey$
      ]
    ).pipe(
      switchMap(([instrument, portfolio]) => this.portfolioSubscriptionsService.getInstrumentPositionSubscription(portfolio, instrument)),
      map(p => {
        if(p == null) {
          return null;
        }

        return {
          abs: Math.abs(p.qtyTFutureBatch),
          quantity: p.qtyTFutureBatch
        };
      }),
      startWith(null)
    );

    const priceData$ = instrumentKey$.pipe(
      switchMap(
        instrument => this.quoteService.getQuotes(
          instrument.symbol,
          instrument.exchange,
          instrument.instrumentGroup
        )
      ),
      map(quote => ({
        dayChange: quote.change,
        dayChangePerPrice: quote.change_percent,
        high: quote.high_price,
        low: quote.low_price,
        lastPrice: quote.last_price,
        ask: quote.ask,
        bid: quote.bid,
        dayOpen: (quote.open_price as number | undefined) ?? 0,
        prevClose: (quote.prev_close_price as number | undefined) ?? 0
      }))
    );

    this.viewData$ = combineLatest([
      instrumentKey$,
      position$,
      priceData$
    ]).pipe(
      map(([instrumentKey, position, priceData]) => ({
        instrumentKey,
        position,
        priceData
      }))
    );
  }

  selectPrice(price: number): void {
    this.priceSelected.emit(price);
  }

  selectQuantity(qty: number): void {
    this.qtySelected.emit(qty);
  }
}
