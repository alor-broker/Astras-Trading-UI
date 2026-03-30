import { Component, input, OnInit, output, inject } from '@angular/core';
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {combineLatest, filter, map, Observable, shareReplay, switchMap} from "rxjs";
import {QuotesService} from "../../../../shared/services/quotes.service";
import {startWith} from "rxjs/operators";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {InstrumentIconComponent} from '../../../../shared/components/instrument-icon/instrument-icon.component';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzDescriptionsComponent, NzDescriptionsItemComponent} from 'ng-zorro-antd/descriptions';
import {AsyncPipe, DecimalPipe} from '@angular/common';
import {toObservable} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-instrument-info',
  templateUrl: './instrument-info.component.html',
  styleUrls: ['./instrument-info.component.less'],
  imports: [
    TranslocoDirective,
    InstrumentIconComponent,
    NzTooltipDirective,
    NzDescriptionsComponent,
    NzDescriptionsItemComponent,
    AsyncPipe,
    DecimalPipe
  ]
})
export class InstrumentInfoComponent implements OnInit {
  private readonly quoteService = inject(QuotesService);
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

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

  readonly priceSelected = output<number>();

  readonly qtySelected = output<number>();

  readonly instrumentKey = input.required<InstrumentKey>();

  readonly currentPortfolio = input.required<PortfolioKey>();

  protected readonly instrumentKeyChanges$ = toObservable(this.instrumentKey)
    .pipe(
      startWith(null),
      shareReplay(1)
    );

  protected readonly currentPortfolioChanges$ = toObservable(this.currentPortfolio)
    .pipe(
      startWith(null),
      shareReplay(1)
    );

  ngOnInit(): void {
    const instrumentKey$ = this.instrumentKeyChanges$
      .pipe(
        filter((i): i is InstrumentKey => !!i),
        shareReplay(1)
      );

    const portfolioKey$ = this.currentPortfolioChanges$
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
        if (p == null) {
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
