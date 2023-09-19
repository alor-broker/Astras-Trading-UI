import { SyntheticInstrumentPart } from "../models/synthetic-instruments.model";
import { Candle } from "../../../shared/models/history/candle.model";
import { Instrument } from "../../../shared/models/instruments/instrument.model";

export const SYNTHETIC_INSTRUMENT_REGEX = /[\^+*\/()-]|[\w:.]+(?:-\d+\.\d+)?[\w:.]*/g;

export class SyntheticInstrumentsHelper {
  static assembleInstrument(instruments: SyntheticInstrumentPart<Instrument>[]): Instrument {
    return instruments.reduce((acc, curr) => {
      if (curr.isSpreadOperator) {
        return {
          ...acc,
          symbol: acc.symbol + curr.value,
          description: acc.description + curr.value,
          exchange: acc.exchange + curr.value,
          type: acc.type + curr.value ?? '',
          shortName: acc.shortName + curr.value,
        } as Instrument;
      } else {
        return {
          symbol: acc.symbol + `${curr.value!.exchange}:${curr.value!.symbol}${curr.value!.instrumentGroup ? ':' + curr.value!.instrumentGroup : ''}`,
          description: acc.description + curr.value!.symbol,
          exchange: acc.exchange + curr.value!.exchange,
          currency: acc.currency || curr.value!.currency,
          type: acc.type + (curr.value!.type ?? ''),
          shortName: acc.shortName + `${curr.value!.exchange}:${curr.value!.symbol}${curr.value!.instrumentGroup ? ':' + curr.value!.instrumentGroup : ''}`,
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
          close: acc.close + curr.value.close,
          open: acc.open + curr.value.open,
          high: acc.high + curr.value.high,
          low: acc.low + curr.value.low,
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
      close: eval(candle.close),
      open: eval(candle.open),
      high: eval(candle.high),
      low: eval(candle.low),
      volume: 0,
    } as Candle;
  }
}
