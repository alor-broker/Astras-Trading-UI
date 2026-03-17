import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, take, takeUntil, tap } from 'rxjs/operators';
import { Candle } from '../../../shared/models/history/candle.model';
import { HistoryResponse } from '../../../shared/models/history/history-response.model';
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../instruments/services/instruments.service';
import { CandlesService } from '../../instruments/services/candles.service';
import { TimeframeValue } from '../../light-chart/models/light-chart.models';
import { AnomalousVolumeItem } from '../models/anomalous-volume-item.model';
import {
  AnomalousVolumeSettings,
  AnomalousVolumeTimeframe
} from '../models/anomalous-volume-settings.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { HistoryService } from '../../../shared/services/history.service';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { AllTradesService } from '../../../shared/services/all-trades.service';
import { AllTradesItem } from '../../../shared/models/all-trades.model';

type CandleExt = Candle & {
  buyVolume?: number;
  sellVolume?: number;
};

interface InstrumentRuntime {
  key: InstrumentKey;
  title: string;
  lotSize: number;
  volumes: number[];
}

@Injectable({
  providedIn: 'root'
})
export class AnomalousVolumeService {
  private readonly candlesService = inject(CandlesService);
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly historyService = inject(HistoryService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly allTradesService = inject(AllTradesService);

  private readonly items$ = new BehaviorSubject<AnomalousVolumeItem[]>([]);
  private readonly reset$ = new Subject<void>();
  private readonly dedup = new Set<string>();
  private readonly runtime = new Map<string, InstrumentRuntime>();
  private readonly storageKeyPrefix = 'anomalous-volume-items';
  private readonly maxItems = 500;
  private activeStorageKey = `${this.storageKeyPrefix}:default`;

  watch(settings: AnomalousVolumeSettings): Observable<AnomalousVolumeItem[]> {
    this.activeStorageKey = this.getStorageKey(settings);
    this.resetInternal(false);
    this.restoreItems(settings);

    const instruments = [...(settings.instruments ?? [])].slice(0, settings.maxInstruments ?? 50);
    if (instruments.length === 0) {
      return this.items$.asObservable();
    }

    combineLatest(
      instruments.map((key: InstrumentKey) =>
        this.instrumentsService.getInstrument(key).pipe(
          take(1),
          map((instrument: Instrument | null) => ({ key, instrument }))
        )
      )
    )
      .pipe(take(1), takeUntil(this.reset$))
      .subscribe((items: { key: InstrumentKey, instrument: Instrument | null }[]) => {
        for (const entry of items) {
          const id = this.toInstrumentId(entry.key);
          this.runtime.set(id, {
            key: entry.key,
            title: entry.instrument?.shortName ?? entry.key.symbol,
            lotSize: entry.instrument?.lotsize ?? 1,
            volumes: []
          });
        }

        this.startStreams(settings, instruments);
      });

    return this.items$.asObservable();
  }

  resetInternal(clearItems = true): void {
    this.reset$.next();
    this.runtime.clear();

    if (clearItems) {
      this.dedup.clear();
      this.items$.next([]);
      this.persistItems([]);
      return;
    }

    this.rebuildDedup();
  }

  private startStreams(settings: AnomalousVolumeSettings, instruments: InstrumentKey[]): void {
    const timeframe = this.mapTimeframe(settings.timeframe);
    const historyTf = this.mapHistoryTimeframe(settings.timeframe);

    for (const key of instruments) {
      this.historyService.getHistory({
        symbol: key.symbol,
        exchange: key.exchange,
        tf: historyTf,
        from: Math.floor(Date.now() / 1000) - 60 * 60 * 12,
        to: Math.floor(Date.now() / 1000),
        countBack: Math.max(50, (settings.windowSize ?? 30) + 5)
      }).pipe(
        take(1),
        takeUntil(this.reset$),
        catchError(() => of(null as HistoryResponse | null))
      ).subscribe((history: HistoryResponse | null) => {
        const id = this.toInstrumentId(key);
        const state = this.runtime.get(id);
        if (state == null || history == null) {
          return;
        }

        state.volumes = history.history
          .map((h: Candle) => h.volume)
          .filter((v: number | null | undefined) => v != null && v > 0)
          .slice(-(Math.max(50, (settings.windowSize ?? 30) + 5)));
      });

      this.candlesService.getInstrumentLastCandle(key, timeframe)
        .pipe(
          takeUntil(this.reset$),
          catchError(() => of(null as unknown as CandleExt)),
          distinctUntilChanged((a: CandleExt | null, b: CandleExt | null) => (a?.time ?? 0) === (b?.time ?? 0)),
          tap((candle: CandleExt | null) => {
            if (candle == null) {
              return;
            }

            this.processCandle(key, candle, settings);
          })
        )
        .subscribe();

      if (settings.showLargeTrades) {
        this.allTradesService.getNewTradesSubscription(key, 100)
          .pipe(
            takeUntil(this.reset$),
            catchError(() => of(null as AllTradesItem | null)),
            tap((trade: AllTradesItem | null) => {
              if (trade == null) {
                return;
              }

              this.processLargeTrade(key, trade, settings);
            })
          )
          .subscribe();
      }
    }
  }

  private processCandle(key: InstrumentKey, candle: CandleExt, settings: AnomalousVolumeSettings): void {
    const instrumentId = this.toInstrumentId(key);
    const state = this.runtime.get(instrumentId);
    if (state == null || candle.volume == null || candle.volume <= 0) {
      return;
    }

    const windowSize = Math.max(5, settings.windowSize ?? 30);
    const sigma = Math.max(0.1, settings.sigmaMultiplier ?? 2.5);

    const prev = state.volumes.slice(-windowSize);
    state.volumes.push(candle.volume);
    if (state.volumes.length > windowSize + 1) {
      state.volumes.shift();
    }

    if (prev.length < windowSize) {
      return;
    }

    const mean = prev.reduce((acc, x) => acc + x, 0) / prev.length;
    const variance = prev.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / prev.length;
    const std = Math.sqrt(variance);
    const threshold = mean + sigma * std;

    if (!(candle.volume > threshold)) {
      return;
    }

    const dedupId = this.buildDedupId(settings.timeframe, `${key.exchange}_${key.symbol}_${candle.time}`);
    if (this.dedup.has(dedupId)) {
      return;
    }

    const item = this.toItem(state, candle, threshold, std);
    if (item == null) {
      return;
    }

    this.dedup.add(this.buildDedupId(settings.timeframe, item.id));

    this.pushItem(item);
  }

  private processLargeTrade(key: InstrumentKey, trade: AllTradesItem, settings: AnomalousVolumeSettings): void {
    const minVolume = Math.max(1, settings.largeTradeMinVolume ?? 10000);
    if (trade.qty < minVolume) {
      return;
    }

    const sideRaw = String(trade.side ?? '').toLowerCase();
    const direction = sideRaw.startsWith('b') ? 'buy' : (sideRaw.startsWith('s') ? 'sell' : null);
    if (direction == null) {
      return;
    }

    const instrumentId = this.toInstrumentId(key);
    const state = this.runtime.get(instrumentId);
    if (state == null) {
      return;
    }

    const detectedAt = this.normalizeTimestampMs(trade.timestamp);
    const item: AnomalousVolumeItem = {
      id: `${key.exchange}_${key.symbol}_trade_${trade.id}_${detectedAt}`,
      eventType: 'large-trade',
      ticker: key.symbol,
      instrument: state.title,
      direction,
      lots: Math.max(1, Math.round(trade.qty / Math.max(1, state.lotSize))),
      moneyVolume: trade.price * trade.qty,
      changePercent: 0,
      buyPercent: direction === 'buy' ? 100 : 0,
      sellPercent: direction === 'sell' ? 100 : 0,
      date: new Date(detectedAt).toLocaleDateString('ru-RU'),
      time: new Date(detectedAt).toLocaleTimeString('ru-RU'),
      detectedAt,
      sigmaScore: 0
    };

    const dedupId = this.buildDedupId(settings.timeframe, item.id);
    if (this.dedup.has(dedupId)) {
      return;
    }

    this.dedup.add(dedupId);
    this.pushItem(item);
  }

  private pushItem(item: AnomalousVolumeItem): void {
    const next = [item, ...this.items$.value]
      .sort((a, b) => b.detectedAt - a.detectedAt)
      .slice(0, this.maxItems);
    this.items$.next(next);
    this.persistItems(next);
  }

  private restoreItems(settings: AnomalousVolumeSettings): void {
    const storedItems = this.localStorageService.getItem<AnomalousVolumeItem[]>(this.activeStorageKey) ?? [];
    const normalized = storedItems
      .filter((item): item is AnomalousVolumeItem =>
        item != null
        && typeof item.id === 'string'
        && typeof item.detectedAt === 'number'
      )
      .sort((a, b) => b.detectedAt - a.detectedAt)
      .slice(0, this.maxItems);

    this.items$.next(normalized);
    this.rebuildDedup(settings.timeframe);
    this.persistItems(normalized);
  }

  private persistItems(items: AnomalousVolumeItem[]): void {
    this.localStorageService.setItem(this.activeStorageKey, items.slice(0, this.maxItems));
  }

  private rebuildDedup(timeframe?: AnomalousVolumeTimeframe): void {
    this.dedup.clear();

    const tf = timeframe ?? '1m';
    for (const item of this.items$.value) {
      this.dedup.add(this.buildDedupId(tf, item.id));
    }
  }

  private buildDedupId(timeframe: AnomalousVolumeTimeframe, itemId: string): string {
    return `${timeframe}_${itemId}`;
  }

  private getStorageKey(settings: AnomalousVolumeSettings): string {
    return `${this.storageKeyPrefix}:${settings.guid ?? 'default'}:${settings.timeframe ?? '1m'}`;
  }

  private toItem(state: InstrumentRuntime, candle: CandleExt, threshold: number, std: number): AnomalousVolumeItem | null {
    const detectedAt = this.normalizeTimestampMs(candle.time);
    const date = new Date(detectedAt);
    const fallbackBuyVolume = candle.close > candle.open ? candle.volume : 0;
    const fallbackSellVolume = candle.close < candle.open ? candle.volume : 0;
    const buyVolume = candle.buyVolume ?? fallbackBuyVolume;
    const sellVolume = candle.sellVolume ?? fallbackSellVolume;

    let buyPercent = 50;
    let sellPercent = 50;

    if (buyVolume > 0 || sellVolume > 0) {
      const total = buyVolume + sellVolume;
      buyPercent = total > 0 ? (buyVolume / total) * 100 : 50;
      sellPercent = total > 0 ? (sellVolume / total) * 100 : 50;
    }

    const hasDeltaData = buyVolume > 0 || sellVolume > 0;
    const direction = hasDeltaData
      ? (buyVolume > sellVolume ? 'buy' : (sellVolume > buyVolume ? 'sell' : null))
      : (candle.close > candle.open ? 'buy' : (candle.close < candle.open ? 'sell' : null));

    if (direction == null) {
      return null;
    }

    const lots = Math.max(1, Math.round(candle.volume / Math.max(1, state.lotSize)));
    const moneyVolume = candle.close * candle.volume;
    const changePercent = candle.open !== 0 ? ((candle.close - candle.open) / candle.open) * 100 : 0;
    const sigmaScore = std > 0 ? (candle.volume - threshold) / std : 0;

    return {
      id: `${state.key.exchange}_${state.key.symbol}_${candle.time}`,
      eventType: 'anomaly',
      ticker: state.key.symbol,
      instrument: state.title,
      direction,
      lots,
      moneyVolume,
      changePercent,
      buyPercent,
      sellPercent,
      date: date.toLocaleDateString('ru-RU'),
      time: date.toLocaleTimeString('ru-RU'),
      detectedAt,
      sigmaScore
    };
  }

  private normalizeTimestampMs(timestamp: number): number {
    return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  }

  private mapTimeframe(timeframe: AnomalousVolumeTimeframe): TimeframeValue {
    switch (timeframe) {
      case '1m':
        return TimeframeValue.M1;
      case '5m':
        return TimeframeValue.M5;
      case '15m':
      default:
        return TimeframeValue.M15;
    }
  }

  private mapHistoryTimeframe(timeframe: AnomalousVolumeTimeframe): string {
    switch (timeframe) {
      case '1m':
        return '60';
      case '5m':
        return '300';
      case '15m':
      default:
        return '900';
    }
  }

  private toInstrumentId(key: InstrumentKey): string {
    return `${key.exchange}:${key.symbol}:${key.instrumentGroup ?? '-'}`;
  }
}
