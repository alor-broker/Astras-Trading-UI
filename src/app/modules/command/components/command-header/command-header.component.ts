import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  shareReplay,
  switchMap,
} from 'rxjs';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { PriceData } from '../../models/price-data.model';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { Position } from '../../../../shared/models/positions/position.model';
import { startWith } from 'rxjs/operators';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { CommandsService } from "../../services/commands.service";
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import {mapWith} from "../../../../shared/utils/observable-helper";

@Component({
  selector: 'ats-command-header[instrument]',
  templateUrl: './command-header.component.html',
  styleUrls: ['./command-header.component.less']
})
export class CommandHeaderComponent implements OnInit, OnDestroy {
  viewData$!: Observable<{ instrument: InstrumentKey, position: { abs: number, quantity: number }, priceData: PriceData }>;
  private readonly commandInstrument$ = new BehaviorSubject<InstrumentKey | null>(null);

  constructor(
    private readonly quoteService: QuotesService,
    private readonly commandsService: CommandsService,
    private readonly history: HistoryService,
    private readonly positionService: PositionsService,
    private readonly currentDashboardService: DashboardContextService) {
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

    const portfolio$ = this.currentDashboardService.selectedPortfolio$;

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
      mapWith(
        instrument => this.history.getLastTwoCandles(instrument),
        (instrument, candles) => ({instrument, candles})
      ),
      mapWith(
        s => this.quoteService.getQuotes(
          s.instrument.symbol,
          s.instrument.exchange,
          s.instrument.instrumentGroup
        ),
        (source, quote) => ({
          candles: source.candles,
          quote
        })
      ),
      map(({candles, quote}) => ({
        dayChange: quote.change,
        dayChangePerPrice: quote.change_percent,
        high: quote.high_price,
        low: quote.low_price,
        lastPrice: quote.last_price,
        ask: quote.ask,
        bid: quote.bid,
        dayOpen: candles?.cur?.open ?? 0,
        prevClose: candles?.prev?.close ?? 0
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

  public selectQuantity(qty: number): void {
    this.commandsService.setQuantitySelected(qty);
  }
}
