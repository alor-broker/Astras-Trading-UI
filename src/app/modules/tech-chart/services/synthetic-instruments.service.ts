import { Injectable } from '@angular/core';
import { InstrumentsService } from "../../instruments/services/instruments.service";
import { HistoryService } from "../../../shared/services/history.service";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { forkJoin, Observable, of } from "rxjs";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { map } from "rxjs/operators";
import { HistoryResponse } from "../../../shared/models/history/history-response.model";
import { Candle } from "../../../shared/models/history/candle.model";

@Injectable({
  providedIn: 'root'
})
export class SyntheticInstrumentsService {

  constructor(
    private readonly instrumentsService: InstrumentsService,
    private readonly historyService: HistoryService
  ) { }

  getInstrument(syntheticInstruments: Array<InstrumentKey | string>): Observable<Instrument | null> {
    const instruments: InstrumentKey[] = <InstrumentKey[]>syntheticInstruments.filter(i => typeof i !== 'string');

    if (
      !instruments.length ||
      !instruments.every(i => (<InstrumentKey>i).symbol && (<InstrumentKey>i).exchange) ||
      syntheticInstruments.filter(i => typeof i === 'string').some(i => (<string>i).match(/[a-zA-Z]/))
    ) {
      return of(null);
    }

    return forkJoin(
      syntheticInstruments.map(i => typeof i === "string" ? of(i) : this.instrumentsService.getInstrument(<InstrumentKey>i))
    )
      .pipe(
        map(instruments => instruments.some(i => i == null) ? null : instruments),
        map(instruments => {
          if (!instruments) {
            return null;
          }

          const instrument: Instrument = {
            symbol: '',
            description: '',
            exchange: '',
            currency: '',
            minstep: Infinity,
            type: '',
            shortName: ''
          };

          instruments.forEach(i => {
            if (typeof i === 'string') {
              instrument.symbol += i;
              instrument.description += i;
              instrument.exchange += i;
              instrument.type += i;
              instrument.shortName += i;
            } else {
              instrument.symbol += `${i!.exchange}:${i!.symbol}${i!.instrumentGroup ? ':' + i!.instrumentGroup : ''}`;
              instrument.description += i!.symbol;
              instrument.exchange += i!.exchange;
              instrument.currency = i!.currency;
              instrument.type += i!.type ?? '';
              instrument.shortName += `${i!.exchange}:${i!.symbol}${i!.instrumentGroup ? ':' + i!.instrumentGroup : ''}`;
              instrument.minstep = Math.min(instrument.minstep, i!.minstep);
            }
          });

          return instrument;
        })
      );
  }

  getHistory(data: {
    syntheticInstruments: Array<InstrumentKey | string>;
    from?: number;
    to: number;
    tf?: string;
  }): Observable<HistoryResponse | null> {
    const instruments: InstrumentKey[] = <InstrumentKey[]>data.syntheticInstruments.filter(i => typeof i !== 'string');

    if (
      !instruments.length ||
      !instruments.every(i => (<InstrumentKey>i).symbol && (<InstrumentKey>i).exchange)
    ) {
      return of(null);
    }

    if (data.syntheticInstruments.length === 1 && typeof data.syntheticInstruments[0] !== 'string') {
      return this.historyService.getHistory({
        symbol: (<InstrumentKey>data.syntheticInstruments[0]).symbol,
        exchange: (<InstrumentKey>data.syntheticInstruments[0]).exchange,
        instrumentGroup: (<InstrumentKey>data.syntheticInstruments[0]).instrumentGroup,
        from: data.from,
        to: data.to,
        tf: data.tf
      });
    }

    return forkJoin(
      data.syntheticInstruments.map(i => typeof i === "string" ? of(i) : this.historyService.getHistory({
        symbol: i.symbol,
        exchange: i.exchange,
        instrumentGroup: i.instrumentGroup,
        from: data.from,
        to: data.to,
        tf: data.tf
      }))
    )
      .pipe(
        map((histories: any) => histories.some((h: HistoryResponse | string | null) => h == null) ? null : histories),
        map((histories: Array<string | HistoryResponse> | null) => {
          if (!histories) {
            return null;
          }

          let instrumentsHistories: HistoryResponse[] = JSON.parse(JSON.stringify(histories.filter(h => typeof h !== 'string')));
          instrumentsHistories = instrumentsHistories.map((history, i) => {
            let historyCopy: Candle[] = JSON.parse(JSON.stringify(history.history));

            for (let j = 0; j < instrumentsHistories.length; j++) {
              if (j === i) {
                continue;
              }
              instrumentsHistories[j].history.forEach((h) => {
                if (!historyCopy.map(sh => sh.time).includes(h.time)) {
                  const nextCandleIndex = historyCopy.findIndex(sh => sh.time > h.time);
                  if (nextCandleIndex !== -1) {
                    historyCopy.splice(nextCandleIndex, 0, { ...historyCopy[nextCandleIndex], time: h.time });
                  }
                }
              });
            }


            return { ...history, history: historyCopy };
          });
          const lastHistoryIndex = Math.min(...instrumentsHistories.map(h => h.history.length));

          for (let i = 0; i < instrumentsHistories.length; i++) {
            instrumentsHistories[i].history.splice(lastHistoryIndex);
          }

          let historyIndex = 0;

          return histories.map(h => {
            if (typeof h === 'string') {
              return h;
            }

            return instrumentsHistories[historyIndex++];
          });
        }),
        map((histories: Array<HistoryResponse | string> | null) => {
          if (!histories) {
            return null;
          }

          const history: any = {
            history: []
          };

          let spreadOperatorsBuffer = '';

          histories.forEach((h: string | HistoryResponse, i) => {
            if (typeof h === 'string') {
              if (i === histories.length - 1) {
                history.history = history.history.map((c: any) => ({
                  ...c,
                  close: c.close + spreadOperatorsBuffer + h,
                  open: c.open + spreadOperatorsBuffer + h,
                  high: c.high + spreadOperatorsBuffer + h,
                  low: c.low + spreadOperatorsBuffer + h
                }));
              } else {
                spreadOperatorsBuffer += h;
              }
            } else {
              h!.history.forEach(c => {
                const candle = history.history.find((hc: any) => hc.time === c.time);

                if (candle) {
                  candle.close += spreadOperatorsBuffer + c.close.toString();
                  candle.open += spreadOperatorsBuffer + c.open.toString();
                  candle.high += spreadOperatorsBuffer + c.high.toString();
                  candle.low += spreadOperatorsBuffer + c.low.toString();
                } else {
                  history.history.push({
                    close: spreadOperatorsBuffer + c.close.toString(),
                    open: spreadOperatorsBuffer + c.open.toString(),
                    high: spreadOperatorsBuffer + c.high.toString(),
                    low: spreadOperatorsBuffer + c.low.toString(),
                    time: c.time,
                    volume: 0
                  });
                }
              });

              history.prev = h.prev;
              history.next = h.next;

              spreadOperatorsBuffer = '';
            }
          });

          history.history = history.history.map((c: any) => ({
              ...c,
              close: eval(c.close),
              open: eval(c.open),
              high: eval(c.high),
              low: eval(c.low)
          }));

          return history;
        })
      );
  }
}
