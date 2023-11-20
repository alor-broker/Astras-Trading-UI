import { Injectable } from '@angular/core';
import {
  DatafeedConfiguration,
  ErrorCallback,
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
import { environment } from "../../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { MathHelper } from "../../../shared/utils/math-helper";
import { SearchFilter } from "../../instruments/models/search-filter.model";
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { ChartSubscriptionIdHelper } from '../../../shared/utils/subscription-id-helper';
import { TranslatorService } from "../../../shared/services/translator.service";
import { SyntheticInstrumentsService } from "./synthetic-instruments.service";
import { map, startWith } from "rxjs/operators";
import { addDaysUnix } from "../../../shared/utils/datetime";
import {
  InstrumentDataPart, OperatorPart,
  RegularOrSyntheticInstrumentKey,
  SyntheticInstrumentPart
} from "../models/synthetic-instruments.model";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { HistoryResponse } from "../../../shared/models/history/history-response.model";
import { SYNTHETIC_INSTRUMENT_REGEX, SyntheticInstrumentsHelper } from "../utils/synthetic-instruments.helper";

const DEFAULT_EXCHANGE = 'MOEX';

@Injectable()
export class TechChartDatafeedService implements IBasicDataFeed {
  private lastBarPoint = new Map<string, number>();
  private readonly barsSubscriptions = new Map<string, Subscription>();

  private onSymbolChange$ = new BehaviorSubject<InstrumentKey | null>(null);
  get onSymbolChange() {
    return this.onSymbolChange$.asObservable();
  }

  constructor(
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly instrumentService: InstrumentsService,
    private readonly historyService: HistoryService,
    private readonly http: HttpClient,
    private readonly translatorService: TranslatorService,
    private readonly syntheticInstrumentsService: SyntheticInstrumentsService
  ) {
  }

  onReady(callback: OnReadyCallback): void {
    this.translatorService.getTranslator('tech-chart/tech-chart')
      .subscribe(t => {
        const config: DatafeedConfiguration = {
          supports_time: true,
          supported_resolutions: this.getSupportedResolutions(),
          exchanges: [
            {
              value: 'MOEX',
              name: t(['MOEX']),
              desc: t(['MOEX'])
            },
            {
              value: 'SPBX',
              name: 'SPBX',
              desc: 'SPBX'
            }
          ]
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
      if (!results) {
        return [];
      }

      return onResult(results.map(x => ({
        symbol: x.symbol,
        exchange: x.exchange,
        ticker: `${x.exchange}:${x.symbol}`,
        description: x.description,
        full_name: `${x.exchange}:${x.symbol}`,
        type: ''
      })));
    });
  }

  resolveSymbol(symbolName: string, onResolve: ResolveCallback, onError: ErrorCallback): void {
    const instrumentsData = this.getSyntheticInstrumentKeys(symbolName);

    let request: Observable<Instrument | null>;

    if (instrumentsData.isSynthetic) {
      request = this.syntheticInstrumentsService.getInstrument(instrumentsData.parts);
    } else {
      request = this.instrumentService.getInstrument(instrumentsData.instrument)
        .pipe(
          map(i => !!i
            ? {
              ...i,
              symbol: `[${i.exchange}:${i.symbol}${i.instrumentGroup ? ':' + i.instrumentGroup : ''}]`
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
        full_name: instrumentDetails.symbol,
        type: instrumentDetails.type ?? '',
        has_empty_bars: false,
        has_intraday: true,
        has_seconds: true,
        timezone: 'Europe/Moscow',
        supported_resolutions: this.getSupportedResolutions(),
        session: '24x7'
      };

      onResolve(resolve);
      this.onSymbolChange$.next(instrumentsData.isSynthetic ? { symbol: '', exchange: '' } : instrumentsData.instrument);
    });
  }

  getBars(symbolInfo: LibrarySymbolInfo, resolution: ResolutionString, periodParams: PeriodParams, onResult: HistoryCallback, onError: ErrorCallback): void {
    const instrumentsData = this.getSyntheticInstrumentKeys(symbolInfo.ticker!);
    const lastBarPointKey = this.getLastBarPointKey(symbolInfo.ticker!, resolution);
    if (periodParams.firstDataRequest) {
      this.lastBarPoint.delete(lastBarPointKey);
    }

    let request: Observable<HistoryResponse | null>;

    if (instrumentsData.isSynthetic) {
      request = this.syntheticInstrumentsService.getHistory({
        syntheticInstruments: instrumentsData.parts,
        from: periodParams.from,
        to: periodParams.to,
        tf: this.parseTimeframe(resolution)
      });
    } else {
      request = this.historyService.getHistory({
        symbol: instrumentsData.instrument.symbol,
        exchange: instrumentsData.instrument.exchange,
        from: periodParams.from,
        to: periodParams.to,
        tf: this.parseTimeframe(resolution)
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
    const instrumentsData = this.getSyntheticInstrumentKeys(symbolInfo.ticker!);

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
                  to: Math.round(Date.now() / 1000)
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

        if (!lastBarPoint || res.time < lastBarPoint) {
          return;
        }

        this.lastBarPoint.set(lastBarPointKey, res.time);

        onTick({ ...res, time: res.time * 1000});
      });

    this.barsSubscriptions.set(listenerGuid, sub);
  }

  getBarsStream(instrument: InstrumentKey, resolution: ResolutionString, ticker: string) {
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

  clear() {
    this.barsSubscriptions.forEach((sub) => {
        sub.unsubscribe();
      }
    );

    this.barsSubscriptions.clear();
    this.onSymbolChange$.complete();
  }

  getServerTime(callback: ServerTimeCallback): void {
    this.http.get<number>(`${environment.apiUrl}//md/v2/time`).pipe(
      take(1)
    ).subscribe(time => {
      callback(time);
    });
  }

  private getSyntheticInstrumentKeys(searchString: string): RegularOrSyntheticInstrumentKey {
    if (!searchString) {
      return { isSynthetic: false, instrument: { symbol: '', exchange: '' }};
    }

    const parts: SyntheticInstrumentPart[] = searchString
        .match(SYNTHETIC_INSTRUMENT_REGEX)
        ?.map(s => {
          if (s.match(/[a-zA-Z]/)) {
            if (s.includes(':')) {
              return {
                isSpreadOperator: false,
                value: this.getSymbolAndExchangeFromTicker(s)
              } as InstrumentDataPart;
            }
            return {
              isSpreadOperator: false,
              value: this.getSymbolAndExchangeFromTicker(DEFAULT_EXCHANGE + ':' + s)
            } as InstrumentDataPart;
          }

          if (s === '^') {
            return { isSpreadOperator: true, value: '**' } as OperatorPart;
          }
          return { isSpreadOperator: true, value: s } as OperatorPart;
        })
      ?? [];

    if (parts.length < 2) {
      if ((<InstrumentDataPart>parts[0])?.value.symbol) {
        return {
          isSynthetic: false,
          instrument: (<InstrumentDataPart>parts[0]).value,
        };
      }
      return { isSynthetic: false, instrument: { symbol: '', exchange: '' }};
    }

    return { isSynthetic: true, parts };
  }

  private getSymbolAndExchangeFromTicker(symbolName: string): InstrumentKey {
    const splits = symbolName.split(':');

    if (splits.length < 2) {
      return { symbol: splits[0], exchange: '' };
    }

    return { symbol: splits[1], exchange: splits[0], instrumentGroup: splits[2] };
  }

  private getLastBarPointKey(ticker: string, resolution: ResolutionString): string {
    return `${ticker.split(':').join('_')}_${resolution}`;
  }

  private parseTimeframe(resolution: ResolutionString): string {
    const code = resolution.slice(-1);
    if (['D', 'W', 'M', 'Y'].includes(code)) {
      return code;
    }

    const count = Number(resolution.substring(0, resolution.length - 1));

    if (code === 'S') {
      return count.toString();
    }

    if (code === 'H') {
      return (count * 3600).toString();
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
      '1' as ResolutionString,
      '5' as ResolutionString,
      '15' as ResolutionString,
      '30' as ResolutionString,
      '1H' as ResolutionString,
      '4h' as ResolutionString,
      '1D' as ResolutionString,
      '1W' as ResolutionString,
      '2W' as ResolutionString,
      '1M' as ResolutionString,
      '3M' as ResolutionString
    ];
  }
}
