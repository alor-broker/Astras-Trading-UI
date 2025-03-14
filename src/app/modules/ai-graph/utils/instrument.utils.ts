import {InstrumentKey} from "../graph/slot-types";
import {ArrayItemsSeparator} from "../constants/graph-data.constants";

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

  static fromArrayToString(instruments: InstrumentKey[]): string {
    return instruments.map(i => this.toString(i))
      .join(ArrayItemsSeparator);
  }

  static isArray(value: string): boolean {
    return value.includes(ArrayItemsSeparator);
  }

  static fromStringToArray(value: string): InstrumentKey[] | null {
    if (value.length === 0 || !this.isArray(value)) {
      return null;
    }

    return value.split(ArrayItemsSeparator)
      .map(i => this.fromString(i));
  }
}
