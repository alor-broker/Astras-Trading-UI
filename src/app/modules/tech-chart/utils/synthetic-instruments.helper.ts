import { SyntheticInstrumentPart } from "../models/synthetic-instruments.model";
import { Candle } from "../../../shared/models/history/candle.model";
import { Instrument } from "../../../shared/models/instruments/instrument.model";

export const SYNTHETIC_INSTRUMENT_REGEX = /[^\[]+(?=])|[\^+*\/()-]|[\w:.]+(?:-\d+\.\d+)?[\w:.]*/g;

export class SyntheticInstrumentsHelper {
  static assembleInstrument(instruments: SyntheticInstrumentPart<Instrument>[]): Instrument {
    return instruments.reduce((acc, curr) => {
      if (curr.isSpreadOperator) {
        return {
          ...acc,
          symbol: acc.symbol + curr.value,
          description: acc.description + curr.value,
          exchange: acc.exchange + curr.value,
          type: (acc.type ?? '') + curr.value,
          shortName: acc.shortName + curr.value,
        } as Instrument;
      } else {
        return {
          symbol:
            acc.symbol +
            `[${curr.value!.exchange}:${curr.value!.symbol}${(curr.value!.instrumentGroup ?? '') ? ':' + (curr.value!.instrumentGroup as string) : ''}]`,
          description: acc.description + curr.value!.symbol,
          exchange: acc.exchange + curr.value!.exchange,
          currency: acc.currency || curr.value!.currency,
          type: (acc.type ?? '') + (curr.value!.type ?? ''),
          shortName: acc.shortName + `[${curr.value!.exchange}:${curr.value!.symbol}${(curr.value!.instrumentGroup ?? '') ? ':' + (curr.value!.instrumentGroup as string) : ''}]`,
          minstep: Math.min(acc.minstep, curr.value!.minstep),
        } as Instrument;
      }
    }, {
      symbol: '',
      description: '',
      exchange: '',
      currency: '',
      minstep: Infinity,
      type: '',
      shortName: ''
    } as Instrument);
  }

  static assembleCandle(candles: SyntheticInstrumentPart<Candle>[]): Candle {
    const candle = candles.reduce((acc, curr) => {
      if (curr.isSpreadOperator) {
          return {
            ...acc,
            close: acc.close + curr.value,
            open: acc.open + curr.value,
            high: acc.high + curr.value,
            low: acc.low + curr.value,
          };
      } else {
        return {
          close: acc.close + curr.value.close.toString(),
          open: acc.open + curr.value.open.toString(),
          high: acc.high + curr.value.high.toString(),
          low: acc.low + curr.value.low.toString(),
          time: Math.max(acc.time, curr.value.time),
        };
      }
    }, {
      close: '',
      open: '',
      high: '',
      low: '',
      time: 0
    });

    return {
      ...candle,
      close: eval(candle.close) as number,
      open: eval(candle.open) as number,
      high: eval(candle.high) as number,
      low: eval(candle.low) as number,
      volume: 0,
    } as Candle;
  }
}
