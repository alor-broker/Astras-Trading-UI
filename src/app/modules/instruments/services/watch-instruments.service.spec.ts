import { HttpClientTestingModule, } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { WatchInstrumentsService } from './watch-instruments.service';
import { TestData } from '../../../shared/utils/testing';
import { WatchlistCollectionService } from './watchlist-collection.service';
import { HistoryService } from '../../../shared/services/history.service';
import {
  BehaviorSubject,
  Subject
} from 'rxjs';
import { Candle } from '../../../shared/models/history/candle.model';
import { BaseResponse } from '../../../shared/models/ws/base-response.model';
import { Quote } from '../../../shared/models/quotes/quote.model';
import { WatchlistCollection } from '../models/watchlist.model';
import { InstrumentsService } from './instruments.service';
import { QuotesService } from '../../../shared/services/quotes.service';

describe('WatchInstrumentsService', () => {
  let service: WatchInstrumentsService;

  let historyServiceSpy: any;
  let watchlistCollectionServiceSpy: any;
  let instrumentsServiceSpy: any;
  let quotesServiceSpy: any;

  const collectionChangedMock = new Subject();
  const daysOpenMock = new BehaviorSubject<Candle | null>({
    low: 0
  } as Candle);

  beforeEach(() => {
    historyServiceSpy = jasmine.createSpyObj('HistoryService', ['getDaysOpen']);
    watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['getWatchlistCollection', 'collectionChanged$', 'getListItems',]);

    watchlistCollectionServiceSpy.collectionChanged$ = collectionChangedMock.asObservable();
    historyServiceSpy.getDaysOpen.and.returnValue(daysOpenMock.asObservable());

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
        { provide: HistoryService, useValue: historyServiceSpy },
        { provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy },
        { provide: InstrumentsService, useValue: instrumentsServiceSpy },
        { provide: QuotesService, useValue: quotesServiceSpy }
      ]
    });
    service = TestBed.inject(WatchInstrumentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#getWatched should read collection', () => {
    watchlistCollectionServiceSpy.getWatchlistCollection.and.callFake(() => {
      return {
        collection: [{
          id: '123',
          title: 'Test List',
          isDefault: false,
          items: TestData.instruments.map(x => ({ ...x }))
        }]
      } as WatchlistCollection;
    });

    service.getWatched({ guid: 'guid', activeListId: '123', instrumentColumns: [] });

    expect(watchlistCollectionServiceSpy.getWatchlistCollection).toHaveBeenCalledTimes(1);
  });

  it('#getWatched should use default list', () => {
    const defaultList = {
      id: '321',
      title: 'Test List',
      isDefault: true,
      items: TestData.instruments.map(x => ({ ...x }))
    };

    watchlistCollectionServiceSpy.getWatchlistCollection.and.callFake(() => {
      return {
        collection: [{
          id: '123',
          title: 'Test List',
          isDefault: false,
          items: TestData.instruments.map(x => ({ ...x }))
        },
          defaultList]
      } as WatchlistCollection;
    });

    let requestedListId: string | undefined;
    watchlistCollectionServiceSpy.getListItems.and.callFake((listId: string) => {
      requestedListId = listId;
      return defaultList.items;
    });

    service.getWatched({ guid: 'guid', activeListId: undefined, instrumentColumns: [] });

    expect(requestedListId).toEqual(defaultList.id);
  });

  it('should reread collection when changed', () => {
    const list = {
      id: '123',
      title: 'Test List',
      isDefault: false,
      items: TestData.instruments.map(x => ({ ...x }))
    };

    watchlistCollectionServiceSpy.getWatchlistCollection.and.returnValue(() => ({
      collection: [list]
    }));

    watchlistCollectionServiceSpy.getListItems.and.callFake(() => {
      return list.items;
    });

    service.getWatched({ guid: 'guid', activeListId: '123', instrumentColumns: [] });
    collectionChangedMock.next(null);

    // first call when we start watching
    // second call when collection changed
    expect(watchlistCollectionServiceSpy.getListItems).toHaveBeenCalledTimes(2);
  });
});
