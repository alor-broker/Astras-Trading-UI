import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import {
  filter,
  map,
  startWith
} from "rxjs/operators";
import {TranslocoDirective} from "@jsverse/transloco";
import {AsyncPipe} from "@angular/common";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {toObservable} from "@angular/core/rxjs-interop";
import {AtsPrice} from '@terminal-core-lib/common/pipes/price';
import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';


@Component({
  selector: 'ats-compact-header',
  templateUrl: './compact-header.html',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzTooltipDirective,
    AtsPrice
  ],
  styleUrls: ['./compact-header.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CompactHeader implements OnInit {
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

  private readonly quotesService = inject(QuotesService);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  ngOnInit(): void {
    this.priceData$ = this.instrumentChanges$.pipe(
      filter((i): i is Instrument => !!i),
      switchMap(i => this.quotesService.getQuotesSubscription(i.symbol, i.exchange, i.instrumentGroup)),
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
