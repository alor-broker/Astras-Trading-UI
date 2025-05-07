import {
  InstrumentDataPart,
  OperatorPart,
  RegularOrSyntheticInstrumentKey,
  SyntheticInstrumentPart
} from "../models/synthetic-instruments.model";
import { Candle } from "../../../shared/models/history/candle.model";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

const DEFAULT_EXCHANGE = 'MOEX';

export const SYNTHETIC_INSTRUMENT_REGEX = /[^\[]+(?=])|[\^+*\/()-]|[\w:.]+(?:-\d+\.\d+)?[\w:.]*/g;

export class SyntheticInstrumentsHelper {
  static getRegularOrSyntheticInstrumentKey(searchString: string): RegularOrSyntheticInstrumentKey {
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
                value: SyntheticInstrumentsHelper.getSymbolAndExchangeFromTicker(s)
              } as InstrumentDataPart;
            }
            return {
              isSpreadOperator: false,
              value: SyntheticInstrumentsHelper.getSymbolAndExchangeFromTicker(DEFAULT_EXCHANGE + ':' + s)
            } as InstrumentDataPart;
          }

          if (s === '^') {
            return { isSpreadOperator: true, value: '**' } as OperatorPart;
          }
          return { isSpreadOperator: true, value: s } as OperatorPart;
        })
        ?? [];

    if (parts.length < 2) {
      if ((parts[0] as InstrumentDataPart | undefined)?.value.symbol != null) {
        return {
          isSynthetic: false,
          instrument: (<InstrumentDataPart>parts[0]).value,
        };
      }
      return { isSynthetic: false, instrument: { symbol: '', exchange: '' }};
    }

    return { isSynthetic: true, parts };
  }

  static getSymbolAndExchangeFromTicker(symbolName: string): InstrumentKey {
    const splits = symbolName.split(':');

    if (splits.length < 2) {
      return { symbol: splits[0], exchange: '' };
    }

    return { symbol: splits[1], exchange: splits[0], instrumentGroup: splits[2] };
  }

  static isSyntheticInstrument(symbolName: string): boolean {
    if (symbolName.includes('[') && symbolName.includes(']')) {
      return SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey(symbolName).isSynthetic;
    }

    return false;
  }

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
            close: acc.close + ' ' + curr.value + ' ',
            open: acc.open + ' ' + curr.value + ' ',
            high: acc.high + ' ' + curr.value + ' ',
            low: acc.low + ' ' + curr.value + ' ',
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
      close: this.calculateExpression(candle.close) ?? NaN,
      open: this.calculateExpression(candle.open) ?? NaN,
      high: this.calculateExpression(candle.high) ?? NaN,
      low: this.calculateExpression(candle.low) ?? NaN,
      volume: 0,
    } as Candle;
  }

  static isSyntheticInstrumentValid(searchString: string): boolean {
    const syntheticInstrument = this.getRegularOrSyntheticInstrumentKey(searchString);

    if (!syntheticInstrument.isSynthetic) {
      return syntheticInstrument.instrument.symbol?.length > 0;
    }

    if (syntheticInstrument.parts.filter(p => !p.isSpreadOperator).length === 0) {
      return false;
    }

    const expressionStr = syntheticInstrument.parts.reduce((acc, curr) => {
      if (curr.isSpreadOperator) {
        return acc + curr.value;
      }

      return acc + '0.1';
    }, '');

    return this.calculateExpression(expressionStr) != null;
  }

  private static calculateExpression(expression: string): number | null {
    try {
      return window.eval(expression) as number;
    } catch {
      return null;
    }
  }
}
