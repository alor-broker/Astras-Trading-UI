import { defer } from 'rxjs';
import { Instrument } from '../models/instruments/instrument.model';
import { ModuleWithProviders, Type } from '@angular/core';
import { SharedModule } from '../shared.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

/**
 * Create async observable that emits-once and completes  after a JS engine turn
 * @param data any data
 * @returns Observable with completed promise
 */
export function asyncData<T>(data: T) {
  return defer(() => Promise.resolve(data));
}
/**
 * A class with a bunch of data for tests
 */
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

/**
 *  SharedModule requires store module registered for root
 */
export const sharedModuleImportForTests: Array<Type<any> | ModuleWithProviders<{}> | any[]> = [
  StoreModule.forRoot({}),
  EffectsModule.forRoot(),
  SharedModule
];
