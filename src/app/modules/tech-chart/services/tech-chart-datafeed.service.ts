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
import { Subscription, take } from "rxjs";
import { HistoryService } from "../../../shared/services/history.service";
import { BaseWebsocketService } from "../../../shared/services/base-websocket.service";
import { WebsocketService } from "../../../shared/services/websocket.service";
import { BarsRequest } from "../../light-chart/models/bars-request.model";
import { Candle } from "../../../shared/models/history/candle.model";
import { environment } from "../../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { MathHelper } from "../../../shared/utils/math-helper";
import { SearchFilter } from "../../instruments/models/search-filter.model";
import { GuidGenerator } from '../../../shared/utils/guid';

@Injectable()
export class TechChartDatafeedService extends BaseWebsocketService implements IBasicDataFeed {
  private lastBarPoint = new Map<string, number>();
  private readonly barsSubscriptions = new Map<string, Subscription>();
  private readonly listenerGuidMap = new Map<string, string>();

  constructor(
    ws: WebsocketService,
    private readonly instrumentService: InstrumentsService,
    private readonly historyService: HistoryService,
    private readonly http: HttpClient,
  ) {
    super(ws);
  }

  onReady(callback: OnReadyCallback): void {

    const config: DatafeedConfiguration = {
      supports_time: true,
      supported_resolutions: this.getSupportedResolutions(),
      exchanges: [
        {
          value: 'MOEX',
          name: 'Московская Биржа',
          desc: 'Московская Биржа'
        },
        {
          value: 'SPBX',
          name: 'SPBX',
          desc: 'SPBX'
        }
      ]
    };

    setTimeout(() => callback(config), 0);
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
        full_name: x.symbol,
        type: ''
      })));
    });
  }

  resolveSymbol(symbolName: string, onResolve: ResolveCallback, onError: ErrorCallback): void {
    const instrumentKey = this.getSymbolAndExchangeFromTicker(symbolName);
    if (!instrumentKey.symbol || !instrumentKey.exchange) {
      onError('Unknown symbol');
      return;
    }

    this.instrumentService.getInstrument(instrumentKey).pipe(
      take(1)
    ).subscribe(instrumentDetails => {
      if (!instrumentDetails) {
        onError('Unknown symbol');
        return;
      }

      const precision = MathHelper.getPrecision(instrumentDetails.minstep);
      const priceScale = Number((10 ** precision).toFixed(precision));

      const resolve: LibrarySymbolInfo = {
        name: instrumentDetails.symbol,
        ticker: symbolName,
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
        timezone: 'Europe/Moscow',
        supported_resolutions: this.getSupportedResolutions(),
        session: '24x7'
      };

      onResolve(resolve);
    });
  }

  getBars(symbolInfo: LibrarySymbolInfo, resolution: ResolutionString, periodParams: PeriodParams, onResult: HistoryCallback, onError: ErrorCallback): void {
    const instrumentKey = this.getSymbolAndExchangeFromTicker(symbolInfo.ticker!);
    const lastBarPointKey = this.getLastBarPointKey(instrumentKey, resolution);
    if (periodParams.firstDataRequest) {
      this.lastBarPoint.delete(lastBarPointKey);
    }

    this.historyService.getHistory({
      code: instrumentKey.symbol,
      exchange: instrumentKey.exchange,
      instrumentGroup: instrumentKey.instrumentGroup,
      from: periodParams.from,
      to: periodParams.to,
      tf: this.parseTimeframe(resolution)
    }).pipe(
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
    const instrumentKey = this.getSymbolAndExchangeFromTicker(symbolInfo.ticker!);
    const requestGuid = `${listenerGuid}_${GuidGenerator.newGuid()}`;
    this.listenerGuidMap.set(listenerGuid, requestGuid);

    const request: BarsRequest = {
      opcode: 'BarsGetAndSubscribe',
      code: instrumentKey.symbol,
      exchange: instrumentKey.exchange,
      instrumentGroup: instrumentKey.instrumentGroup,
      format: 'simple',
      guid: requestGuid,
      tf: this.parseTimeframe(resolution),
      from: this.lastBarPoint.get(this.getLastBarPointKey(instrumentKey, resolution)) ?? this.getDefaultLastHistoryPoint()
    };

    const sub = this.getEntity<Candle>(request).subscribe(candle => {
      const lastBarPoint = this.lastBarPoint.get(this.getLastBarPointKey(instrumentKey, resolution));
      if (!lastBarPoint || candle.time < lastBarPoint) {
        return;
      }

      onTick({
        ...candle,
        time: candle.time * 1000
      });
    });

    this.barsSubscriptions.set(listenerGuid, sub);
  }

  unsubscribeBars(listenerGuid: string): void {
    const sub = this.barsSubscriptions.get(listenerGuid);
    if (!!sub) {
      sub.unsubscribe();

      const requestGuid = this.listenerGuidMap.get(listenerGuid);
      if (!!requestGuid) {
        this.unsubscribe(requestGuid);
        this.listenerGuidMap.delete(listenerGuid);
      }
    }
  }

  clear() {
    this.barsSubscriptions.forEach((sub, key) => {
        sub.unsubscribe();
        this.unsubscribe(key);
      }
    );

    this.barsSubscriptions.clear();
  }

  getServerTime(callback: ServerTimeCallback): void {
    this.http.get<number>(`${environment.apiUrl}//md/v2/time`).pipe(
      take(1)
    ).subscribe(time => {
      callback(time);
    });
  }

  private getSymbolAndExchangeFromTicker(symbolName: string): InstrumentKey {
    if (!symbolName) {
      return { symbol: '', exchange: '' };
    }

    const splits = symbolName.split(':');

    if (splits.length < 2) {
      return { symbol: splits[0], exchange: '' };
    }

    return { symbol: splits[1], exchange: splits[0], instrumentGroup: splits[2] };
  }

  private getLastBarPointKey(instrument: InstrumentKey, resolution: ResolutionString): string {
    return `${instrument.symbol}_${instrument.exchange}_${instrument.instrumentGroup}_${resolution}`;
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
      '1' as ResolutionString,
      '5' as ResolutionString,
      '15' as ResolutionString,
      '1H' as ResolutionString,
      '4h' as ResolutionString,
      '1D' as ResolutionString,
      '1M' as ResolutionString
    ];
  }
}
