import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {startWith} from "rxjs/operators";
import {DefaultRateProvider} from "../../utils/rate-provider";
import {ConversionMatrix} from "../../utils/conversion-matrix";
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {AsyncPipe} from '@angular/common';
import {NzTableModule} from 'ng-zorro-antd/table';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {MarketService} from '@terminal-core-lib/features/market-config/market.service';
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {ContentSize} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {
  Rate,
  RateValue
} from '@terminal-widgets-lib/widgets/exchange-rate/types/exchange-rate.types';
import {ExchangeRateWidgetSettings} from '@terminal-widgets-lib/widgets/exchange-rate/widget-settings.types';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {CurrencyPair} from '@terminal-core-lib/features/exchange-rate/services/exchange-rate-service.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {ExchangeRateService} from '@terminal-core-lib/features/exchange-rate/services/exchange-rate.service';
import {TableRowHeight} from '@terminal-core-lib/common/directives/table-row-height';
import {PriceDiff} from '@terminal-core-lib/common/components/price-diff/price-diff';

interface CurrencyMatrix {
  currencies: string[];
  rates: Record<string, RateValue | null>;
}

@Component({
  selector: 'ats-exchange-rate',
  templateUrl: './exchange-rate.html',
  styleUrls: ['./exchange-rate.less'],
  imports: [
    NzResizeObserverDirective,
    NzTableModule,
    AsyncPipe,
    TableRowHeight,
    PriceDiff
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ExchangeRate implements OnInit, OnDestroy {
  readonly guid = input.required<string>();

  readonly tableScroll$ = new BehaviorSubject<ContentSize | null>({width: 50, height: 50});

  currencyMatrix$!: Observable<CurrencyMatrix>;

  round = MathHelper.round;

  private readonly settingsService = inject(WidgetSettingsService);

  private readonly exchangeRateService = inject(ExchangeRateService);

  private readonly quotesService = inject(QuotesService);

  private readonly marketService = inject(MarketService);

  private readonly actionsContext = inject(ACTIONS_CONTEXT);

  ngOnInit(): void {
    this.currencyMatrix$ = this.exchangeRateService.getCurrencyPairs().pipe(
      map(pairs => {
        const rateProvider = new DefaultRateProvider();
        return {
          currencyPairs: pairs,
          rateProvider,
          conversionMatrix: ConversionMatrix.build(pairs ?? [], rateProvider)
        };
      }),
      mapWith(
        x => this.getExchangeRates(x.currencyPairs ?? []),
        (x, rates) => this.toCurrencyMatrix(x.conversionMatrix, x.rateProvider, rates)
      ),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  selectInstrument(item: RateValue): void {
    if (item.sourceSymbol == null) {
      return;
    }

    this.marketService.getMarketSettings().pipe(
      take(1)
    ).subscribe(marketSettings => {
      this.settingsService.getSettings<ExchangeRateWidgetSettings>(this.guid()).pipe(
        take(1)
      ).subscribe(s => {
        this.actionsContext.selectInstrument({
            symbol: item.sourceSymbol!,
            exchange: marketSettings.currencies.defaultCurrencyExchange
          },
          s.badgeColor ?? DefaultBadge);
      });
    });
  }

  updateContainerSize(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      const virtualPadding = 7;
      const width = Math.floor(x.contentRect.width) - virtualPadding;
      const height = Math.floor(x.contentRect.height) - virtualPadding;

      const tableHeader = x.target.querySelector('.ant-table-thead');
      const scrollHeight = Math.floor(height - (tableHeader?.clientHeight ?? 0));

      this.tableScroll$.next({
        width: width,
        height: scrollHeight
      });
    });
  }

  ngOnDestroy(): void {
    this.tableScroll$.complete();
  }

  getCurrencyKey(fromCurrency: string, toCurrency: string): string {
    return `${fromCurrency}_${toCurrency}`;
  }

  private toCurrencyMatrix(conversionMatrix: ConversionMatrix, rateProvider: DefaultRateProvider, rateValues: Rate[]): CurrencyMatrix {
    rateProvider.updateRates(rateValues);
    const currencies = conversionMatrix.getCurrencies();

    const rates: Record<string, RateValue | null> = {};
    for (const firstCurrency of currencies) {
      for (const secondCurrency of currencies) {
        rates[this.getCurrencyKey(firstCurrency, secondCurrency)] = conversionMatrix.getRate(firstCurrency, secondCurrency);
      }
    }

    return {
      currencies,
      rates
    };
  }

  private getExchangeRates(currencyPairs: CurrencyPair[]): Observable<Rate[]> {
    const getCurrencyStream = (pair: CurrencyPair, exchange: string): Observable<Rate> => {
      return this.quotesService.getQuotesSubscription(
        pair.symbolTom,
        exchange
      )
        .pipe(
          map(quote => ({
            fromCurrency: pair.firstCode,
            toCurrency: pair.secondCode,
            symbolTom: pair.symbolTom,
            lastPrice: quote.last_price,
            change: quote.change ?? 0
          })),
          startWith({
            fromCurrency: pair.firstCode,
            toCurrency: pair.secondCode,
            symbolTom: pair.symbolTom,
            lastPrice: 0,
            change: 0
          })
        );
    };

    return this.marketService.getMarketSettings().pipe(
      switchMap(marketSettings => {
        return combineLatest(
          currencyPairs.map(item => getCurrencyStream(item, marketSettings.currencies.defaultCurrencyExchange))
        );
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  };
}
