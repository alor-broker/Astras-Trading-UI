import { Injectable, inject } from '@angular/core';
import { InstrumentsService } from "../../instruments/services/instruments.service";
import { HistoryService } from "../../../shared/services/history.service";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { forkJoin, Observable, of } from "rxjs";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { map } from "rxjs/operators";
import { HistoryResponse } from "../../../shared/models/history/history-response.model";
import { Candle } from "../../../shared/models/history/candle.model";
import { InstrumentDataPart, OperatorPart, SyntheticInstrumentPart } from "../models/synthetic-instruments.model";
import { SyntheticInstrumentsHelper } from "../utils/synthetic-instruments.helper";

@Injectable({
  providedIn: 'root'
})
export class SyntheticInstrumentsService {
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly historyService = inject(HistoryService);

  getInstrument(syntheticInstruments: SyntheticInstrumentPart[]): Observable<Instrument | null> {
    const instrumentKeys: InstrumentKey[] = <InstrumentKey[]>syntheticInstruments.filter(p => !p.isSpreadOperator).map(p => p.value);

    if (!instrumentKeys.length) {
      return of(null);
    }

    return forkJoin(
      syntheticInstruments.map(p => p.isSpreadOperator
        ? of(p)
        : this.instrumentsService.getInstrument(p.value)
          .pipe(map(value => ({ isSpreadOperator: false, value} as InstrumentDataPart<Instrument | null>)))
      )
    )
      .pipe(
        map(instruments => instruments.some(i => i.value == null) ? null : instruments as (OperatorPart | InstrumentDataPart<Instrument>)[]),
        map(instruments => {
          if (!instruments) {
            return null;
          }

          return SyntheticInstrumentsHelper.assembleInstrument(instruments);
        })
      );
  }

  getHistory(data: {
    syntheticInstruments: SyntheticInstrumentPart[];
    from: number;
    to: number;
    tf: string;
    countBack: number;
  }): Observable<HistoryResponse | null> {
    const instruments: InstrumentKey[] = <InstrumentKey[]>data.syntheticInstruments
      .filter(p => !p.isSpreadOperator)
      .map(p => p.value);

    if (!instruments.length) {
      return of(null);
    }

    return forkJoin(
      data.syntheticInstruments.map(p => p.isSpreadOperator
        ? of(p)
        : this.historyService.getHistory({
          symbol: p.value.symbol,
          exchange: p.value.exchange,
          from: data.from,
          to: data.to,
          tf: data.tf,
          countBack: data.countBack
        })
          .pipe(map(value => ({isSpreadOperator: false, value})))
      )
    )
      .pipe(
        map(histories => histories.some(h => h.value == null) ? null : histories),
        map(histories => {
          if (!histories) {
            return null;
          }

          // Собираются свечи таким образом, чтоб если по одному из инструментов свечка есть, а по другому - нет,
          // будет браться предыдущая свечка
          let instrumentsHistories = JSON.parse(JSON.stringify(histories
            .filter(h => !h.isSpreadOperator)
            .map(h => h.value))) as HistoryResponse[];

          if (instrumentsHistories.some(h => h.history.length === 0)) {
            return histories.map(history => {
              if (history.isSpreadOperator) {
                return history as OperatorPart;
              }

              return {
                isSpreadOperator: false,
                value: {
                  history: [],
                  prev: 0,
                  next: 0
                }
              } as InstrumentDataPart<HistoryResponse>;
            });
          }

          instrumentsHistories = instrumentsHistories.map((history, i) => {
            const historyCopy = JSON.parse(JSON.stringify(history.history)) as Candle[];

            // Перебираются свечи по каждому инструменту, кроме текущего
            for (let j = 0; j < instrumentsHistories.length; j++) {
              if (j === i) {
                continue;
              }
              instrumentsHistories[j].history.forEach((h) => {
                // Если в истории по текущему инструменту нет свечки, которая есть в инстроиях других инструментов
                if (!historyCopy.map(sh => sh.time).includes(h.time)) {
                  // Ищем следующую свечку
                  const nextCandleIndex = historyCopy.findIndex(sh => sh.time > h.time);
                  // Если эта свечка не первая в массиве (в этом случае нельзя взять предыдущую")
                  if (nextCandleIndex !== 0) {
                    historyCopy.splice(
                      // Берём предыдущую свечку, либо последнюю в истории (если "следующая" свечка не нашлась)
                      nextCandleIndex === -1 ? historyCopy.length : nextCandleIndex,
                      0,
                      { ...historyCopy[(nextCandleIndex === -1 ? historyCopy.length : nextCandleIndex) - 1], time: h.time }
                    );
                  }
                }
              });
            }

            return { ...history, history: historyCopy };
          });

          // После цикла в истории каждого инструмента концы списка будут одинаковые и нужно каждый конец обрезать,
          // чтоб не брались свечи, которых нет в историях по некоторым инструментам
          const lastHistoryIndex = Math.min(...instrumentsHistories.map(h => h.history.length));

          for (const history of instrumentsHistories) {
            history.history = history.history.slice(-lastHistoryIndex);
          }

          let historyIndex = 0;

          return histories.map(h => {
            if (h.isSpreadOperator) {
              return h as OperatorPart;
            }

            return { isSpreadOperator: false, value: instrumentsHistories[historyIndex++] } as InstrumentDataPart<HistoryResponse>;
          });
        }),
        map((histories: SyntheticInstrumentPart<HistoryResponse>[] | null) => {
          if (!histories) {
            return null;
          }

          const defaultHistory = (<HistoryResponse>histories.find(h => !h.isSpreadOperator)!.value).history;

          const history: HistoryResponse = {
            history: new Array(defaultHistory.length).fill(null)
              .map((item: any, i: number) => SyntheticInstrumentsHelper.assembleCandle(
                histories.map(h => h.isSpreadOperator ? h : {isSpreadOperator: false, value: h.value!.history[i]}))
              ),
            prev: defaultHistory[0]?.time - 60,
            next: defaultHistory[defaultHistory.length - 1]?.time + 60
          };

          return history;
        })
      );
  }
}
