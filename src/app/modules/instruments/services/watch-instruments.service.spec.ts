import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WebsocketService } from 'src/app/shared/services/websocket.service';

import { WatchInstrumentsService } from './watch-instruments.service';
import { TestData } from '../../../shared/utils/testing';
import { WatchlistCollectionService } from './watchlist-collection.service';
import { DashboardService } from '../../../shared/services/dashboard.service';
import { HistoryService } from '../../../shared/services/history.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { Candle } from '../../../shared/models/history/candle.model';
import { BaseResponse } from '../../../shared/models/ws/base-response.model';
import { Quote } from '../../../shared/models/quotes/quote.model';
import { WatchlistCollection } from '../models/watchlist.model';

describe('WatchInstrumentsService', () => {
  let service: WatchInstrumentsService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;

  let spy: any;
  let dashboardServiceSpy: any;
  let historyServiceSpy: any;
  let watchlistCollectionServiceSpy: any;

  const collectionChangedMock = new Subject();
  const daysOpenMock = new BehaviorSubject<Candle | null>(null);
  const messagesMock = new Subject<BaseResponse<Quote>>();

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    spy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);
    dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getSettings']);
    historyServiceSpy = jasmine.createSpyObj('HistoryService', ['getDaysOpen']);
    watchlistCollectionServiceSpy = jasmine.createSpyObj('WatchlistCollectionService', ['getWatchlistCollection', 'collectionChanged$', 'getListItems',]);

    watchlistCollectionServiceSpy.collectionChanged$ = collectionChangedMock.asObservable();
    historyServiceSpy.getDaysOpen.and.returnValue(daysOpenMock.asObservable());
    spy.messages$ = messagesMock.asObservable();

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        WatchInstrumentsService,
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: HistoryService, useValue: historyServiceSpy },
        { provide: WebsocketService, useValue: spy },
        { provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy }
      ]
    });
    service = TestBed.inject(WatchInstrumentsService);
    httpClient = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
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

    service.getWatched({ guid: 'guid', activeListId: '123' });

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

    service.getWatched({ guid: 'guid', activeListId: undefined });

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

    service.getWatched({ guid: 'guid', activeListId: '123' });
    collectionChangedMock.next(null);

    // first call when we start watching
    // second call when collection changed
    expect(watchlistCollectionServiceSpy.getListItems).toHaveBeenCalledTimes(2);
  });
});
