import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { filter, map, Observable, of, Subject, switchMap, takeUntil} from 'rxjs';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { getDayChange, getDayChangePerPrice } from 'src/app/shared/utils/price';
import { PriceData } from '../../models/price-data.model';
import { buyColor, sellColor } from 'src/app/shared/models/settings/styles-constants';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';
import { Store } from '@ngrx/store';
import { getSelectedPortfolio } from '../../../../store/portfolios/portfolios.selectors';

@Component({
  selector: 'ats-command-header[symbol][exchange]',
  templateUrl: './command-header.component.html',
  styleUrls: ['./command-header.component.less']
})
export class CommandHeaderComponent implements OnInit, OnDestroy {
  @Input()
  symbol = '';
  @Input()
  exchange = '';
  @Input()
  instrumentGroup : string = '';
  priceData$ : Observable<PriceData | null> = of(null);
  colors = {
    buyColor: buyColor,
    sellColor: sellColor
  };
  position = {
    abs: 0, quantity: 0
  };
  private destroy$ : Subject<boolean> = new Subject<boolean>();

  constructor(
    private quoteService : QuotesService,
    private history : HistoryService,
    private positionService : PositionsService,
    private store : Store) {
  }

  ngOnDestroy() : void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngOnInit() : void {
    this.store.select(getSelectedPortfolio).pipe(
      filter((p) : p is PortfolioKey => !!p),
      switchMap(p => {
        return this.positionService.getByPortfolio(p.portfolio, p.exchange, this.symbol);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (p) => {
        if (p) {
          this.position = { abs: Math.abs(p.qtyTFutureBatch), quantity: p.qtyTFutureBatch };
        }
      }
    });

    this.priceData$ = this.history.getDaysOpen({
      symbol: this.symbol,
      exchange: this.exchange,
      instrumentGroup: this.instrumentGroup
    }).pipe(
      switchMap(candle => {
        return this.quoteService.getQuotes(
          this.symbol,
          this.exchange,
          this.instrumentGroup
        ).pipe(
          map(quote => ({ candle, quote }))
        );
      }),
      map((data) : PriceData => ({
        dayChange: getDayChange(data.quote.last_price, data.candle?.close ?? 0),
        dayChangePerPrice: getDayChangePerPrice(data.quote.last_price, data.candle?.close ?? 0),
        high: data.quote.high_price,
        low: data.quote.low_price,
        lastPrice: data.quote.last_price,
        ask: data.quote.ask,
        bid: data.quote.bid,
        dayOpen: data.candle?.open ?? 0,
        prevClose: data.candle?.close ?? 0
      }))
    );
/*
    this.priceData$ = interval(2000)
      .pipe(
        withLatestFrom(this.priceData$),
        filter(([a, x]) => !!x),
        map(([a, x]) => (<PriceData | null>{
          ...x,
          lastPrice: !!x ? ( a%2 ? x.lastPrice + 0.01 : Math.ceil(x.lastPrice)): 0
        }))
      );*/
  }
}
