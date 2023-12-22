import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  CurrencyPair,
  ExchangeRateService
} from "../../../../shared/services/exchange-rate.service";
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import { startWith } from "rxjs/operators";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { QuotesService } from '../../../../shared/services/quotes.service';
import { ContentSize } from "../../../../shared/models/dashboard/dashboard-item.model";
import { MarketService } from "../../../../shared/services/market.service";
import { MathHelper } from "../../../../shared/utils/math-helper";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { ExchangeRateSettings } from "../../models/exchange-rate-settings.model";
import {
  Rate,
  RateValue
} from "../../models/exchange-rate.model";
import { DefaultRateProvider } from "../../utils/rate-provider";
import { ConversionMatrix } from "../../utils/conversion-matrix";
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from "../../../../shared/services/actions-context";

interface CurrencyMatrix {
  currencies: string[];
  rates: { [key: string]: RateValue | null };
}

@Component({
  selector: 'ats-exchange-rate',
  templateUrl: './exchange-rate.component.html',
  styleUrls: ['./exchange-rate.component.less']
})
export class ExchangeRateComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  guid!: string;

  readonly tableScroll$ = new BehaviorSubject<ContentSize | null>({ width: 50, height: 50 });

  currencyMatrix$!: Observable<CurrencyMatrix>;
  round = MathHelper.round;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly quotesService: QuotesService,
    private readonly marketService: MarketService,
    @Inject(ACTIONS_CONTEXT)
    private readonly actionsContext: ActionsContext
  ) {
  }

  ngOnInit(): void {
    this.currencyMatrix$ = this.exchangeRateService.getCurrencyPairs().pipe(
      map(pairs => {
        const rateProvider = new DefaultRateProvider();
        return {
          currencyPairs: pairs,
          rateProvider,
          conversionMatrix: ConversionMatrix.build(pairs, rateProvider)
        };
      }),
      mapWith(
        x => this.getExchangeRates(x.currencyPairs),
        (x, rates) => this.toCurrencyMatrix(x.conversionMatrix, x.rateProvider, rates)
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  selectInstrument(item: RateValue): void {
    if (item.sourceSymbol == null) {
      return;
    }

    this.marketService.getMarketSettings().pipe(
      take(1)
    ).subscribe(marketSettings => {
      this.settingsService.getSettings<ExchangeRateSettings>(this.guid).pipe(
        take(1)
      ).subscribe(s => {
        this.actionsContext.instrumentSelected({
            symbol: item.sourceSymbol!,
            exchange: marketSettings.currencies.defaultCurrencyExchange
          },
          s.badgeColor ?? defaultBadgeColor);
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

    const rates: { [key: string]: RateValue | null } = {};
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
      return this.quotesService.getQuotes(
        pair.symbolTom,
        exchange
      )
        .pipe(
          map(quote => ({
            fromCurrency: pair.firstCode,
            toCurrency: pair.secondCode,
            symbolTom: pair.symbolTom,
            lastPrice: quote.last_price,
            change: quote.change
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
      shareReplay({ bufferSize: 1, refCount: true })
    );
  };
}
