import { defer } from 'rxjs';
import { Instrument } from '../models/instruments/instrument.model';

/** Create async observable that emits-once and completes
 *  after a JS engine turn */
export function asyncData<T>(data: T) {
  return defer(() => Promise.resolve(data));
}

export class TestData {
  public static get instruments(): Instrument[] {
    return [
      {
        symbol: 'AAPL',
        exchange: 'SPBX',
        instrumentGroup: 'SPBX',
        isin: 'US0378331005',
        description: 'AAPL',
        shortName: 'AAPL',
        currency: "RUB",
        minstep: 0.01
      },
      {
        symbol: 'DSKY',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU000A0JSQ90',
        description: 'DSKY',
        shortName: 'DSKY',
        currency: "RUB",
        minstep: 0.01
      },
      {
        symbol: 'SBER',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU0009029540',
        description: 'SBER',
        shortName: 'SBER',
        currency: "RUB",
        minstep: 0.01
      },
      {
        symbol: 'DVEC',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU000A0JP2W1',
        description: 'DVEC',
        shortName: 'DVEC',
        currency: "RUB",
        minstep: 0.01
      }
    ];
  }
}
