/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Exchanges } from '../models/enums/exchanges';
import { SyncState } from '../ngrx/reducers/sync.reducer';
import { ModalService } from './modal.service';

describe('Service: Modal', () => {
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
        ModalService,
        provideMockStore({ initialState })
      ]
    });
  });

  it('should ...', inject([ModalService], (service: ModalService) => {
    expect(service).toBeTruthy();
  }));
});
