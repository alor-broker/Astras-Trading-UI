import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import { WatchInstrumentsService } from './watch-instruments.service';
import { WatchlistCollectionService } from './watchlist-collection.service';
import { HistoryService } from '../../../shared/services/history.service';
import {
  BehaviorSubject,
  NEVER,
  of,
  skip,
  Subject,
  take
} from 'rxjs';
import { Candle } from '../../../shared/models/history/candle.model';
import { WatchlistCollection } from '../models/watchlist.model';
import { InstrumentsService } from './instruments.service';
import { QuotesService } from '../../../shared/services/quotes.service';
import { GuidGenerator } from "../../../shared/utils/guid";
import { TimeframeValue } from "../../light-chart/models/light-chart.models";
import { MathHelper } from "../../../shared/utils/math-helper";
import { CandlesService } from "./candles.service";
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import { filter } from "rxjs/operators";
import { TestData } from "../../../shared/utils/testing/test-data";

describe('WatchInstrumentsService', () => {
  let service: WatchInstrumentsService;

  let historyServiceSpy: any;
  let watchlistCollectionServiceSpy: any;
  let instrumentsServiceSpy: any;
  let quotesServiceSpy: any;
  let candlesServiceSpy: any;

  const collectionChangedMock = new Subject();
  const daysOpenMock = new BehaviorSubject<{ cur: Candle, prev: Candle } | null>(
    {
      cur: {
        low: 0
      } as Candle,
      prev: {
        low: 0
      } as Candle
    }
  );

  beforeEach(() => {
    historyServiceSpy = jasmine.createSpyObj('HistoryService', ['getLastTwoCandles', 'getHistory']);
    watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['getWatchlistCollection', 'collectionChanged$', 'getListItems',]);

    watchlistCollectionServiceSpy.collectionChanged$ = collectionChangedMock.asObservable();
    historyServiceSpy.getLastTwoCandles.and.returnValue(daysOpenMock.asObservable());
    historyServiceSpy.getHistory.and.returnValue(of(null));

    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
    instrumentsServiceSpy.getInstrument.and.returnValue(new Subject());

    candlesServiceSpy = jasmine.createSpyObj('CandlesService', ['getInstrumentLastCandle']);
    candlesServiceSpy.getInstrumentLastCandle.and.returnValue(new Subject());

    quotesServiceSpy = jasmine.createSpyObj('QuotesService', ['getQuotes']);
    quotesServiceSpy.getQuotes.and.returnValue(new Subject());
  });

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        WatchInstrumentsService,
        {provide: HistoryService, useValue: historyServiceSpy},
        {provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy},
        {provide: InstrumentsService, useValue: instrumentsServiceSpy},
        {provide: QuotesService, useValue: quotesServiceSpy},
        {provide: CandlesService, useValue: candlesServiceSpy},
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(WatchInstrumentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#getWatched should read collection', () => {
    watchlistCollectionServiceSpy.getWatchlistCollection.and.callFake(() => {
      return new BehaviorSubject({
        collection: [{
          id: '123',
          title: 'Test List',
          isDefault: false,
          items: TestData.instruments.map(x => ({...x, recordId: GuidGenerator.newGuid()}))
        }]
      } as WatchlistCollection);
    });

    service.subscribeToListUpdates('123', TimeframeValue.Day);

    expect(watchlistCollectionServiceSpy.getWatchlistCollection).toHaveBeenCalledTimes(1);
  });

  it('#setupInstrumentUpdatesSubscription should emit right values of price change', fakeAsync(() => {
    instrumentsServiceSpy.getInstrument.and.returnValue(of({
      ...TestData.instruments[0]
    }));

    const nowDate = Math.round(new Date().getTime() / 1000);
    const historyRes = [
      {time: nowDate - 3600 * 24 * 3, close: 1},
      {time: nowDate - 3600 * 24 * 2, close: 3},
      {time: nowDate - 3600 * 24, close: 5},
    ];

    historyServiceSpy.getHistory.and.returnValue(of({
      history: historyRes
    }));

    candlesServiceSpy.getInstrumentLastCandle.and.returnValue(NEVER);

    const newQuote = {
      change: 1,
      prev_close_price: 1,
      open_price: 1,
      last_price: 10,
      low_price: 1,
      high_price: 1,
      volume: 1,
    };

    const newQuote$ = new BehaviorSubject(newQuote);

    quotesServiceSpy.getQuotes.and.returnValue(newQuote$);

    watchlistCollectionServiceSpy.getWatchlistCollection.and.callFake(() => {
      return new BehaviorSubject({
        collection: [{
          id: '123',
          title: 'Test List',
          isDefault: false,
          items: [{
            ...TestData.instruments[0],
            recordId: GuidGenerator.newGuid()
          }]
        }]
      } as WatchlistCollection);
    });

    service.subscribeToListUpdates('123', TimeframeValue.Day)
      .pipe(
        filter(x => x.length > 0),
        skip(1),
        take(1)
      )
      .subscribe((wi) => {
        const expectedInstrument = {
          priceChange: MathHelper.round(wi[0]!.price! - historyRes[historyRes.length - 1].close, 4),
          priceChangeRatio: MathHelper.round(((wi[0]!.price! / historyRes[historyRes.length - 1].close) - 1) * 100, 2)
        };

        expect(wi.length).toBe(1);
        expect(wi[0]).toEqual(jasmine.objectContaining(expectedInstrument));
      });

    tick(1000);
  }));

  it('#setupInstrumentUpdatesSubscription should emit zero values when no history', fakeAsync(() => {
    instrumentsServiceSpy.getInstrument.and.returnValue(of({
      ...TestData.instruments[0]
    }));

    historyServiceSpy.getHistory.and.returnValue(of({
      history: []
    }));

    const newCandle$ = new Subject();
    candlesServiceSpy.getInstrumentLastCandle.and.returnValue(newCandle$);

    const newQuote$ = new BehaviorSubject({
      change: 1,
      prev_close_price: 1,
      open_price: 1,
      last_price: 10,
      low_price: 1,
      high_price: 1,
      volume: 1,
    });

    quotesServiceSpy.getQuotes.and.returnValue(newQuote$);

    watchlistCollectionServiceSpy.getWatchlistCollection.and.callFake(() => {
      return new BehaviorSubject({
        collection: [{
          id: '123',
          title: 'Test List',
          isDefault: false,
          items: [{
            ...TestData.instruments[0],
            recordId: GuidGenerator.newGuid()
          }]
        }]
      } as WatchlistCollection);
    });

    service.subscribeToListUpdates('123', TimeframeValue.Day)
      .pipe(
        skip(1),
        take(1)
      )
      .subscribe((wi) => {
        const expectedInstrument = {
          priceChange: 0,
          priceChangeRatio: 0
        };

        expect(wi.length).toBe(1);
        expect(wi[0]).toEqual(jasmine.objectContaining(expectedInstrument));
      });

    tick(1000);
  }));
});
