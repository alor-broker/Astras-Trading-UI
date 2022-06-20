import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { getDayChange, getDayChangePerPrice } from 'src/app/shared/utils/price';
import { PriceData } from '../../models/price-data.model';
import { buyColor, sellColor } from 'src/app/shared/models/settings/styles-constants';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';
import { Store } from '@ngrx/store';
import { getSelectedPortfolio } from '../../../../store/portfolios/portfolios.selectors';
import { Position } from '../../../../shared/models/positions/position.model';
import { startWith } from 'rxjs/operators';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { CommandsService } from "../../services/commands.service";

@Component({
  selector: 'ats-command-header[instrument]',
  templateUrl: './command-header.component.html',
  styleUrls: ['./command-header.component.less']
})
export class CommandHeaderComponent implements OnInit, OnDestroy {
  colors = {
    buyColor: buyColor,
    sellColor: sellColor
  };
  viewData$!: Observable<{ instrument: InstrumentKey, position: { abs: number, quantity: number }, priceData: PriceData }>;
  private readonly commandInstrument$ = new BehaviorSubject<InstrumentKey | null>(null);

  constructor(
    private readonly quoteService: QuotesService,
    private readonly commandsService: CommandsService,
    private readonly history: HistoryService,
    private readonly positionService: PositionsService,
    private readonly store: Store) {
  }

  @Input()
  set instrument(value: InstrumentKey) {
    this.commandInstrument$.next(value);
  }

  ngOnDestroy(): void {
    this.commandInstrument$.complete();
  }

  ngOnInit(): void {
    const instrument$ = this.commandInstrument$
      .pipe(
        filter((i): i is Instrument => !!i),
        shareReplay()
      );

    const portfolio$ = this.store.select(getSelectedPortfolio).pipe(
      filter((p): p is PortfolioKey => !!p)
    );

    const position$ = combineLatest([instrument$, portfolio$]).pipe(
      switchMap(([instrument, portfolio]) => this.positionService.getByPortfolio(portfolio.portfolio, portfolio.exchange, instrument.symbol)),
      filter((p): p is Position => !!p),
      map(p => ({
        abs: Math.abs(p.qtyTFutureBatch),
        quantity: p.qtyTFutureBatch
      })),
      startWith(({
        abs: 0,
        quantity: 0
      }))
    );

    const priceData$ = instrument$.pipe(
      switchMap(instrument => combineLatest([
        of(instrument),
        this.history.getDaysOpen(instrument),
      ])),
      switchMap(([instrument, candle]) => combineLatest([
        of(candle),
        this.quoteService.getQuotes(
          instrument.symbol,
          instrument.exchange,
          instrument.instrumentGroup
        ),
      ])),
      map(([candle, quote]) => ({
        dayChange: getDayChange(quote.last_price, candle?.close ?? 0),
        dayChangePerPrice: getDayChangePerPrice(quote.last_price, candle?.close ?? 0),
        high: quote.high_price,
        low: quote.low_price,
        lastPrice: quote.last_price,
        ask: quote.ask,
        bid: quote.bid,
        dayOpen: candle?.open ?? 0,
        prevClose: candle?.close ?? 0
      }))
    );

    this.viewData$ = combineLatest([
      instrument$,
      position$,
      priceData$
    ]).pipe(
      map(([instrument, position, priceData]) => ({
        instrument,
        position,
        priceData
      }))
    );
  }

  public selectPrice(price: number): void {
    this.commandsService.setPriceSelected(price);
  }
}
