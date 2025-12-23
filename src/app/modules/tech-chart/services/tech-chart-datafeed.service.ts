import { Injectable, inject } from '@angular/core';
import {
  DatafeedConfiguration,
  DatafeedErrorCallback,
  HistoryCallback,
  IBasicDataFeed,
  LibrarySymbolInfo,
  OnReadyCallback,
  PeriodParams,
  ResolutionString,
  ResolveCallback,
  SearchSymbolsCallback,
  ServerTimeCallback,
  SubscribeBarsCallback,
  Timezone,
} from "../../../../assets/charting_library";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { InstrumentsService } from "../../instruments/services/instruments.service";
import {
  Observable,
  Subscription,
  take,
  combineLatest, switchMap, BehaviorSubject, of
} from "rxjs";
import { HistoryService } from "../../../shared/services/history.service";
import { BarsRequest } from "../../light-chart/models/bars-request.model";
import { Candle } from "../../../shared/models/history/candle.model";
import { HttpClient } from "@angular/common/http";
import { MathHelper } from "../../../shared/utils/math-helper";
import { SearchFilter } from "../../instruments/models/search-filter.model";
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { TranslatorService } from "../../../shared/services/translator.service";
import { SyntheticInstrumentsService } from "./synthetic-instruments.service";
import { map, startWith } from "rxjs/operators";
import { addDaysUnix } from "../../../shared/utils/datetime";
import { InstrumentDataPart } from "../models/synthetic-instruments.model";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { HistoryResponse } from "../../../shared/models/history/history-response.model";
import { SyntheticInstrumentsHelper } from "../utils/synthetic-instruments.helper";
import { EnvironmentService } from "../../../shared/services/environment.service";
import {
  ExchangeSettings,
  MarketExchange
} from "../../../shared/models/market-settings.model";
import { ChartSubscriptionIdHelper } from "../../../shared/utils/chart-subscription-id-helper";

@Injectable()
export class TechChartDatafeedService implements IBasicDataFeed {
  private readonly environmentService = inject(EnvironmentService);
  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);
  private readonly instrumentService = inject(InstrumentsService);
  private readonly historyService = inject(HistoryService);
  private readonly http = inject(HttpClient);
  private readonly translatorService = inject(TranslatorService);
  private readonly syntheticInstrumentsService = inject(SyntheticInstrumentsService);

  private readonly lastBarPoint = new Map<string, number>();
  private readonly barsSubscriptions = new Map<string, Subscription>();
  private exchangeSettings: MarketExchange[] | null = null;

  private readonly onSymbolChange$ = new BehaviorSubject<InstrumentKey | null>(null);
  get onSymbolChange(): Observable<InstrumentKey | null> {
    return this.onSymbolChange$.asObservable();
  }

  setExchangeSettings(settings: { exchange: string, settings: ExchangeSettings }[]): void {
    this.exchangeSettings = settings;
  }

  onReady(callback: OnReadyCallback): void {
    this.translatorService.getTranslator('tech-chart/tech-chart').pipe(
      take(1)
    ).subscribe(t => {
        const config: DatafeedConfiguration = {
          supports_time: true,
          supported_resolutions: this.getSupportedResolutions(),
          exchanges: (this.exchangeSettings ?? [])
            .map(x => ({
              value: x.exchange,
              name: t([x.exchange], { fallback: x.exchange }),
              desc: t([x.exchange], { fallback: x.exchange })
            }))
        };

        setTimeout(() => callback(config), 0);
      });
  }

  searchSymbols(userInput: string, exchange: string, symbolType: string, onResult: SearchSymbolsCallback): void {
    this.instrumentService.getInstruments({
      query: userInput,
      exchange: exchange
    } as SearchFilter).pipe(
      take(1)
    ).subscribe(results => {
      return onResult(results.map(x => ({
        symbol: x.symbol,
        exchange: x.exchange,
        ticker: `[${x.exchange}:${x.symbol}]`,
        description: x.description,
        type: ''
      })));
    });
  }

  resolveSymbol(symbolName: string, onResolve: ResolveCallback, onError: DatafeedErrorCallback): void {
    const instrumentsData = SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey(symbolName);

    let request: Observable<Instrument | null>;

    if (instrumentsData.isSynthetic) {
      request = this.syntheticInstrumentsService.getInstrument(instrumentsData.parts);
    } else {
      request = this.instrumentService.getInstrument(instrumentsData.instrument)
        .pipe(
          map(i => !!i
            ? {
              ...i,
              symbol: `[${i.exchange}:${i.symbol}${(i.instrumentGroup != null && i.instrumentGroup.length > 0) ? ':' + i.instrumentGroup : ''}]`
            }
            : i)
        );
    }

    request.pipe(
      take(1)
    ).subscribe(instrumentDetails => {
      if (!instrumentDetails) {
        onError('Unknown symbol');
        return;
      }

      const precision = MathHelper.getPrecision(instrumentDetails.minstep);
      const priceScale = Number((10 ** precision).toFixed(precision));

      const instrumentExchange = (this.exchangeSettings ?? []).find(x => x.exchange === instrumentDetails.exchange);

      const resolve: LibrarySymbolInfo = {
        name: instrumentDetails.shortName,
        ticker: instrumentDetails.symbol,
        description: instrumentDetails.description,
        exchange: instrumentDetails.exchange,
        listed_exchange: instrumentDetails.exchange,
        currency_code: instrumentDetails.currency,
        minmov: Math.round(instrumentDetails.minstep * priceScale),
        pricescale: priceScale,
        format: 'price',
        type: instrumentDetails.type ?? '',
        has_empty_bars: false,
        has_intraday: true,
        has_seconds: true,
        has_weekly_and_monthly: true,
        weekly_multipliers: ['1','2'],
        monthly_multipliers: ['1','3','6','12'],
        timezone:  instrumentExchange?.settings.timezone as Timezone ?? 'Europe/Moscow',
        session: instrumentExchange?.settings.defaultTradingSession ?? '0700-0000,0000-0200:1234567',
      };

      onResolve(resolve);
      this.onSymbolChange$.next(instrumentsData.isSynthetic ? instrumentDetails : instrumentsData.instrument);
    });
  }

  getBars(symbolInfo: LibrarySymbolInfo, resolution: ResolutionString, periodParams: PeriodParams, onResult: HistoryCallback, onError: DatafeedErrorCallback): void {
    const instrumentsData = SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey(symbolInfo.ticker!);
    const lastBarPointKey = this.getLastBarPointKey(symbolInfo.ticker!, resolution);
    if (periodParams.firstDataRequest) {
      this.lastBarPoint.delete(lastBarPointKey);
    }

    let request: Observable<HistoryResponse | null>;

    if (instrumentsData.isSynthetic) {
      request = this.syntheticInstrumentsService.getHistory({
        syntheticInstruments: instrumentsData.parts,
        from: Math.max(periodParams.from, 0),
        to: Math.max(periodParams.to, 1),
        tf: this.parseTimeframe(resolution),
        countBack: periodParams.countBack
      });
    } else {
      request = this.historyService.getHistory({
        symbol: instrumentsData.instrument.symbol,
        exchange: instrumentsData.instrument.exchange,
        from: Math.max(periodParams.from, 0),
        to: Math.max(periodParams.to, 1),
        tf: this.parseTimeframe(resolution),
        countBack: periodParams.countBack
      });
    }

    request.pipe(
      take(1)
    ).subscribe(history => {
      if (!history) {
        onError('Unable to load history');
        return;
      }

      const dataIsEmpty = history.history.length === 0;

      if (periodParams.firstDataRequest) {
        this.lastBarPoint.set(
          lastBarPointKey,
          dataIsEmpty
            ? this.getDefaultLastHistoryPoint()
            : history.history[history.history.length - 1].time
        );
      }

      const nextTime = periodParams.firstDataRequest ? history.next : history.prev;
      onResult(
        history.history.map(x => ({
          ...x,
          time: x.time * 1000
        })),
        {
          noData: dataIsEmpty,
          nextTime: dataIsEmpty ? nextTime : undefined
        }
      );
    });
  }

  subscribeBars(symbolInfo: LibrarySymbolInfo, resolution: ResolutionString, onTick: SubscribeBarsCallback, listenerGuid: string): void {
    const instrumentsData = SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey(symbolInfo.ticker!);

    let request: Observable<Candle | null>;

    if (instrumentsData.isSynthetic) {
      const instruments: InstrumentDataPart[] = <InstrumentDataPart[]>instrumentsData.parts
        .filter(p => !p.isSpreadOperator);

      request = combineLatest(instrumentsData.parts
        .filter(p => !p.isSpreadOperator)
        .map(p =>
          this.getBarsStream((<InstrumentDataPart>p).value, resolution, symbolInfo.ticker!)
            .pipe(
              startWith(null)
            )
        )
      )
        .pipe(
          switchMap(candles => {
            if (candles.every(c => c == null)) {
              return of(null);
            }

            // Если по одной из новых свечей есть данные, и хотя бы по одной другой - нет,
            // нужно взять последнюю существующую свечку по этому инструменту
            if (candles.some(c => c == null)) {
              return combineLatest(candles.map((c, i) => c == null
                ? this.historyService.getHistory({
                  symbol: instruments[i].value.symbol,
                  exchange: instruments[i].value.exchange,
                  tf: this.parseTimeframe(resolution),
                  from: addDaysUnix(new Date(), -30),
                  to: Math.round(Date.now() / 1000),
                  countBack: 1
                })
                  .pipe(map(history => history!.history[history!.history.length - 1]!))
                : of(c)
              ));
            }

            return of(candles);
          }),
          map(candles => {
            if (!candles) {
              return null;
            }

            let candleIndex = 0;

            return SyntheticInstrumentsHelper.assembleCandle(
              instrumentsData.parts.map((item) => {
                if (item.isSpreadOperator) {
                  return item;
                }

                return { isSpreadOperator: false, value: candles[candleIndex++] } as InstrumentDataPart<Candle>;
              })
            );
          })
        );
    } else {
      request = this.getBarsStream(instrumentsData.instrument, resolution, symbolInfo.ticker!);
    }

    const sub = request
      .subscribe(res => {
        if (!res) {
          return;
        }

        const lastBarPointKey = this.getLastBarPointKey(symbolInfo.ticker!, resolution);
        const lastBarPoint = this.lastBarPoint.get(lastBarPointKey);

        if (lastBarPoint == null || res.time < lastBarPoint) {
          return;
        }

        this.lastBarPoint.set(lastBarPointKey, res.time);

        onTick({ ...res, time: res.time * 1000});
      });

    this.barsSubscriptions.set(listenerGuid, sub);
  }

  getBarsStream(instrument: InstrumentKey, resolution: ResolutionString, ticker: string): Observable<Candle> {
    const request: BarsRequest = {
      opcode: 'BarsGetAndSubscribe',
      code: instrument.symbol,
      exchange: instrument.exchange,
      instrumentGroup: instrument.instrumentGroup ?? null,
      format: 'simple',
      tf: this.parseTimeframe(resolution),
      from: this.lastBarPoint.get(this.getLastBarPointKey(ticker, resolution)) ?? this.getDefaultLastHistoryPoint()
    };

    return this.subscriptionsDataFeedService.subscribe<BarsRequest, Candle>(
      request,
      ChartSubscriptionIdHelper.getCandleSubscriptionId
    );
  }

  unsubscribeBars(listenerGuid: string): void {
    const sub = this.barsSubscriptions.get(listenerGuid);
    if (!!sub) {
      sub.unsubscribe();
    }
  }

  clear(): void {
    this.barsSubscriptions.forEach((sub) => {
        sub.unsubscribe();
      }
    );

    this.barsSubscriptions.clear();
    this.onSymbolChange$.complete();
  }

  getServerTime(callback: ServerTimeCallback): void {
    this.http.get<number>(`${this.environmentService.apiUrl}/md/v2/time`).pipe(
      take(1)
    ).subscribe(time => {
      callback(time);
    });
  }

  private getLastBarPointKey(ticker: string, resolution: ResolutionString): string {
    return `${ticker.split(':').join('_')}_${resolution}`;
  }

  private parseTimeframe(resolution: ResolutionString): string {
    const code = resolution.slice(-1);
    if (['D', 'W', 'M', 'Y'].includes(code)) {
      return resolution;
    }

    const count = Number(resolution.substring(0, resolution.length - 1));

    if (code === 'S') {
      return count.toString();
    }

    if (code === 'H') {
      return (count * 60 * 60).toString();
    }

    // resolution contains minutes
    return (Number(resolution) * 60).toString();
  }

  private getDefaultLastHistoryPoint(): number {
    const now = new Date();
    return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))).getTime() / 1000;
  }

  private getSupportedResolutions(): ResolutionString[] {
    return [
      '1S' as ResolutionString,
      '5S' as ResolutionString,
      '10S' as ResolutionString,
      '15S' as ResolutionString,
      '30S' as ResolutionString,
      '45S' as ResolutionString,
      '1' as ResolutionString,
      '2' as ResolutionString,
      '3' as ResolutionString,
      '5' as ResolutionString,
      '10' as ResolutionString,
      '15' as ResolutionString,
      '30' as ResolutionString,
      '45' as ResolutionString,
      '1H' as ResolutionString,
      '2H' as ResolutionString,
      '3H' as ResolutionString,
      '4h' as ResolutionString,
      '1D' as ResolutionString,
      '1W' as ResolutionString,
      '2W' as ResolutionString,
      '1M' as ResolutionString,
      '3M' as ResolutionString,
      '6M' as ResolutionString,
      '12M' as ResolutionString
    ];
  }
}
