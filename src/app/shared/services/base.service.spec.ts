/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Exchanges } from '../models/enums/exchanges';
import { AnySettings } from '../models/settings/any-settings.model';
import { SyncState } from '../ngrx/reducers/sync.reducer';
import { BaseService } from './base.service';

describe('BaseService', () => {
  const initialState : SyncState = {
    instrument: {
      symbol: 'SBER',
      exchange: Exchanges.MOEX,
      instrumentGroup: 'TQBR',
      isin: 'RU0009029540'
    },
    portfolio: {
      portfolio: "D39004",
      exchange: Exchanges.MOEX
    }
  }
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BaseService,
        provideMockStore({ initialState })
      ]
    });
  });

  it('should ...', inject([BaseService], (service: BaseService<AnySettings>) => {
    expect(service).toBeTruthy();
  }));
});
