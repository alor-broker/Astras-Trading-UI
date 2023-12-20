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
  ACTIONS_CONTEXT,
  ActionsContext
} from "../../../../shared/services/actions-context";

interface RateMatrixValue {
  rate: number;
  symbol: string | null;
}

interface CurrencyMatrix {
  currencies: string[];
  rates: { [key: string]: RateMatrixValue | null };
}

interface Rate {
  fromCurrency: string;
  toCurrency: string;
  symbolTom: string;
  lastPrice: number;
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
      mapWith(
        currencies => this.getExchangeRates(currencies),
        (currencies, rates) => this.toCurrencyMatrix(currencies, rates)
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  selectInstrument(item: RateMatrixValue): void {
    if (item.symbol == null) {
      return;
    }

    this.marketService.getMarketSettings().pipe(
      take(1)
    ).subscribe(marketSettings => {
      this.settingsService.getSettings<ExchangeRateSettings>(this.guid).pipe(
        take(1)
      ).subscribe(s => {
        this.actionsContext.instrumentSelected({
            symbol: item.symbol!,
            exchange: marketSettings.currencies.defaultCurrencyExchange
          },
          s.badgeColor ?? defaultBadgeColor);
      });
    });
  }

  updateContainerSize(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      const virtualPadding = 5;
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

  private toCurrencyMatrix(currencies: CurrencyPair[], rateValues: Rate[]): CurrencyMatrix {
    const allCurrencies = Array.from(new Set([
        ...currencies.map(item => item.firstCode),
        ...currencies.map(item => item.secondCode)]
      )
    ).sort((a, b) => a.localeCompare(b));

    const values = new Map<string, Rate>();
    rateValues.forEach(x => {
      values.set(this.getCurrencyKey(x.fromCurrency, x.toCurrency), x);
    });

    const rates: { [key: string]: RateMatrixValue | null } = {};

    for (const firstCurrency of allCurrencies) {
      for (const secondCurrency of allCurrencies) {
        const pairKey = this.getCurrencyKey(firstCurrency, secondCurrency);

        if (firstCurrency === secondCurrency) {
          rates[pairKey] = null;
          continue;
        }

        const directRate = values.get(this.getCurrencyKey(firstCurrency, secondCurrency));
        if (directRate != null) {
          rates[pairKey] = {
            rate: directRate.lastPrice,
            symbol: directRate.symbolTom
          };

          continue;
        }

        const reverseRate = values.get(this.getCurrencyKey(secondCurrency, firstCurrency));
        if (reverseRate != null && reverseRate.lastPrice > 0) {
          rates[pairKey] = {
            rate: 1 / reverseRate.lastPrice,
            symbol: null
          };

          continue;
        }

        rates[pairKey] = null;
      }
    }

    return {
      currencies: allCurrencies,
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
            lastPrice: quote.last_price
          })),
          startWith({
            fromCurrency: pair.firstCode,
            toCurrency: pair.secondCode,
            symbolTom: pair.symbolTom,
            lastPrice: 0
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
