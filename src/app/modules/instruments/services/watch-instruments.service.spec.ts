import {HttpClientTestingModule,} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';

import {WatchInstrumentsService} from './watch-instruments.service';
import {TestData} from '../../../shared/utils/testing';
import {WatchlistCollectionService} from './watchlist-collection.service';
import {HistoryService} from '../../../shared/services/history.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {Candle} from '../../../shared/models/history/candle.model';
import {WatchlistCollection} from '../models/watchlist.model';
import {InstrumentsService} from './instruments.service';
import {QuotesService} from '../../../shared/services/quotes.service';
import {GuidGenerator} from "../../../shared/utils/guid";

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
    historyServiceSpy = jasmine.createSpyObj('HistoryService', ['getLastTwoCandles']);
    watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['getWatchlistCollection', 'collectionChanged$', 'getListItems',]);

    watchlistCollectionServiceSpy.collectionChanged$ = collectionChangedMock.asObservable();
    historyServiceSpy.getLastTwoCandles.and.returnValue(daysOpenMock.asObservable());

    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
    instrumentsServiceSpy.getInstrument.and.returnValue(new Subject());

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

    service.getWatched('123');

    expect(watchlistCollectionServiceSpy.getWatchlistCollection).toHaveBeenCalledTimes(1);
  });
});
