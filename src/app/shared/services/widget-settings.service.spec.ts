/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { Exchanges } from '../models/enums/exchanges';
import { SyncState } from '../ngrx/reducers/sync.reducer';
import { WidgetSettingsService } from './widget-settings.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';

describe('WidgetSettingsService', () => {
  let store: MockStore;
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
        WidgetSettingsService,
        provideMockStore({ initialState }),
      ],
    });
    store = TestBed.inject(MockStore);
  });

  it('should ...', inject([WidgetSettingsService], (service: WidgetSettingsService) => {
    expect(service).toBeTruthy();
  }));
});

