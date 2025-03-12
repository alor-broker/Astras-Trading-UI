import {InstrumentKey} from "../graph/slot-types";

export class InstrumentUtils {
  private static readonly Separator = ':';

  static fromString(value: string): InstrumentKey {
    const instruments = value.split(this.Separator);

    return {
      symbol: instruments[0] ?? '',
      exchange: instruments[1] ?? ''
    };
  }

  static toString(instrument: InstrumentKey): string {
    return [
      instrument.symbol,
      instrument.exchange
    ].join(this.Separator);
  }
}
