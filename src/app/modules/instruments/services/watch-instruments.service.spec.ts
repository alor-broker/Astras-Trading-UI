import { HttpClientTestingModule, } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { WatchInstrumentsService } from './watch-instruments.service';
import { TestData } from '../../../shared/utils/testing';
import { WatchlistCollectionService } from './watchlist-collection.service';
import { HistoryService } from '../../../shared/services/history.service';
import { BehaviorSubject, of, skip, Subject, take } from 'rxjs';
import { Candle } from '../../../shared/models/history/candle.model';
import { WatchlistCollection } from '../models/watchlist.model';
import { InstrumentsService } from './instruments.service';
import { QuotesService } from '../../../shared/services/quotes.service';
import { GuidGenerator } from "../../../shared/utils/guid";
import { TimeframeValue } from "../../light-chart/models/light-chart.models";

describe('WatchInstrumentsService', () => {
  let service: WatchInstrumentsService;

  let historyServiceSpy: any;
  let watchlistCollectionServiceSpy: any;
  let instrumentsServiceSpy: any;
  let quotesServiceSpy: any;

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

    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument', 'getInstrumentLastCandle']);
    instrumentsServiceSpy.getInstrument.and.returnValue(new Subject());
    instrumentsServiceSpy.getInstrumentLastCandle.and.returnValue(new Subject());

    quotesServiceSpy = jasmine.createSpyObj('QuotesService', ['getQuotes']);
    quotesServiceSpy.getQuotes.and.returnValue(new Subject());
  });

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        WatchInstrumentsService,
        {provide: HistoryService, useValue: historyServiceSpy},
        {provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy},
        {provide: InstrumentsService, useValue: instrumentsServiceSpy},
        {provide: QuotesService, useValue: quotesServiceSpy}
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

    service.getWatched('123', TimeframeValue.Day);

    expect(watchlistCollectionServiceSpy.getWatchlistCollection).toHaveBeenCalledTimes(1);
  });

  it('#setupInstrumentUpdatesSubscription should emit right values of price change', fakeAsync(() => {
    instrumentsServiceSpy.getInstrument.and.returnValue(of({
      ...TestData.instruments[0]
    }));

    historyServiceSpy.getHistory.and.returnValue(of({
      history: [
        { time: 1, close: 1 },
        { time: 2, close: 5 },
        { time: 3, close: 10 },
      ]
    }));

    const newCandle$ = new Subject();
    instrumentsServiceSpy.getInstrumentLastCandle.and.returnValue(newCandle$);

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

    service.getWatched('123', TimeframeValue.Day)
      .pipe(take(1))
      .subscribe((wi) => {
        const expectedInstrument = {
          priceChange: 5,
          priceChangeRatio: 100
        };

        expect(wi.length).toBe(1);
        expect(wi[0]).toEqual(jasmine.objectContaining(expectedInstrument));
      });

    tick();

    service.getWatched('123', TimeframeValue.Day)
      .pipe(
        skip(2),
        take(1)
      )
      .subscribe((wi) => {
        const expectedInstrument = {
          priceChange: 6,
          priceChangeRatio: 150
        };

        expect(wi.length).toBe(1);
        expect(wi[0]).toEqual(jasmine.objectContaining(expectedInstrument));
      });

    tick();
    newCandle$.next({ time: 4, close: 4 });
    tick();
    newCandle$.next({ time: 5, close: 5 });
    tick();
  }));

  it('#setupInstrumentUpdatesSubscription should emit zero values when no history', fakeAsync(() => {
    instrumentsServiceSpy.getInstrument.and.returnValue(of({
      ...TestData.instruments[0]
    }));

    historyServiceSpy.getHistory.and.returnValue(of({
      history: []
    }));

    const newCandle$ = new Subject();
    instrumentsServiceSpy.getInstrumentLastCandle.and.returnValue(newCandle$);

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

    service.getWatched('123', TimeframeValue.Day)
      .pipe(take(1))
      .subscribe((wi) => {
        const expectedInstrument = {
          priceChange: 0,
          priceChangeRatio: 0
        };

        expect(wi.length).toBe(1);
        expect(wi[0]).toEqual(jasmine.objectContaining(expectedInstrument));
      });

    tick();
  }));
});
