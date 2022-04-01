/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Exchanges } from '../models/enums/exchanges';
import { SyncState } from '../ngrx/reducers/sync.reducer';
import { WidgetFactoryService } from './widget-factory.service';

describe('WidgetFactoryService', () => {
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
        WidgetFactoryService,
        provideMockStore({ initialState }),
      ]
    });
  });

  it('should ...', inject([WidgetFactoryService], (service: WidgetFactoryService) => {
    expect(service).toBeTruthy();
  }));
});
