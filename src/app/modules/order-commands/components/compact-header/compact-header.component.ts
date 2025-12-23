import { Component, input, OnInit, output, inject } from '@angular/core';
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {combineLatest, Observable, shareReplay, switchMap} from "rxjs";
import {QuotesService} from "../../../../shared/services/quotes.service";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {filter, map, startWith} from "rxjs/operators";
import {TranslocoDirective} from "@jsverse/transloco";
import {AsyncPipe} from "@angular/common";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {AtsPricePipe} from "../../../../shared/pipes/ats-price.pipe";
import {toObservable} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-compact-header',
  templateUrl: './compact-header.component.html',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzTooltipDirective,
    AtsPricePipe
  ],
  styleUrls: ['./compact-header.component.less']
})
export class CompactHeaderComponent implements OnInit {
  private readonly quotesService = inject(QuotesService);
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  readonly priceSelected = output<number>();

  readonly qtySelected = output<number>();

  priceData$!: Observable<{ bid: number, ask: number }>;
  positionInfo$!: Observable<{ abs: number, quantity: number } | null>;
  readonly instrument = input.required<Instrument>();
  readonly currentPortfolio = input.required<PortfolioKey>();
  protected readonly instrumentChanges$ = toObservable(this.instrument)
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
    this.priceData$ = this.instrumentChanges$.pipe(
      filter((i): i is Instrument => !!i),
      switchMap(i => this.quotesService.getQuotes(i.symbol, i.exchange, i.instrumentGroup)),
      map(x => ({
        bid: x.bid,
        ask: x.ask
      }))
    );

    this.positionInfo$ = combineLatest(
      [
        this.instrumentChanges$,
        this.currentPortfolioChanges$
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

  getPriceDecimalSymbolsCount(instrument: Instrument): number | null {
    return MathHelper.getPrecision(instrument.minstep);
  }
}
