import { TestBed } from '@angular/core/testing';

import { WatchlistCollectionService } from './watchlist-collection.service';
import {
  WatchlistCollection,
  WatchlistType
} from '../models/watchlist.model';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { TranslocoTestingModule } from "@jsverse/transloco";
import { GuidGenerator } from "../../../shared/utils/guid";
import { WatchlistCollectionBrokerService } from "./watchlist-collection-broker.service";
import {
  BehaviorSubject, of,
  Subject,
  take
} from "rxjs";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { InstrumentsService } from "./instruments.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TestData } from "../../../shared/utils/testing/test-data";

describe('WatchListCollectionService', () => {
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
  let watchlistCollectionBrokerServiceSpy: any;

  let service: WatchlistCollectionService;

  const testCollection = {
    collection: [{
      id: '123',
      title: 'Test List',
      isDefault: false,
      items: TestData.instruments.map(x => ({ ...x, recordId: GuidGenerator.newGuid() }))
    },
      {
        id: '321',
        title: 'Test List',
        isDefault: true,
        items: TestData.instruments.map(x => ({ ...x, recordId: GuidGenerator.newGuid() }))
      },
      {
        id: '456',
        title: 'Test List',
        type: WatchlistType.HistoryList,
        items: TestData.instruments.map(x => ({ ...x, recordId: GuidGenerator.newGuid() }))
      }
    ]
  } as WatchlistCollection;

  const setupGetItemMock = (returnValue: WatchlistCollection | null = null): void => {
    watchlistCollectionBrokerServiceSpy.getCollection.and.returnValue(new BehaviorSubject(JSON.parse(JSON.stringify(returnValue?.collection))));
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    watchlistCollectionBrokerServiceSpy = jasmine.createSpyObj('WatchlistCollectionBrokerService', ['addOrUpdateLists', 'removeList', 'getCollection']);

    TestBed.configureTestingModule({
    imports: [TranslocoTestingModule],
    providers: [
        WatchlistCollectionService,
        { provide: WatchlistCollectionBrokerService, useValue: watchlistCollectionBrokerServiceSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        {
            provide: EnvironmentService,
            useValue: {
                apiUrl: ''
            }
        },
        {
            provide: InstrumentsService,
            useValue: {
                getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of(null))
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});

    service = TestBed.inject(WatchlistCollectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#getWatchlistCollection should read value from broker', () => {
    setupGetItemMock(testCollection);

    service.getWatchlistCollection().pipe(
      take(1)
    ).subscribe(collection => {
      expect(collection).toEqual(testCollection);
    });
  });

  it('#getWatchlistCollection should create default collection if missing', () => {
    setupGetItemMock({ collection: [] });
    watchlistCollectionBrokerServiceSpy.addOrUpdateLists.and.returnValue(new Subject());

    service.getWatchlistCollection()
      .pipe(
        take(1)
      ).subscribe();

    expect(watchlistCollectionBrokerServiceSpy.addOrUpdateLists).toHaveBeenCalled();
  });

  it('#createNewList should call broker', () => {
    watchlistCollectionBrokerServiceSpy.addOrUpdateLists.and.returnValue(new Subject());

    service.createNewList('test list', []);

    expect(watchlistCollectionBrokerServiceSpy.addOrUpdateLists).toHaveBeenCalled();
  });

  it('#removeList should call broker', () => {
    setupGetItemMock(testCollection);
    watchlistCollectionBrokerServiceSpy.removeList.and.returnValue(new Subject());
    service.removeList(testCollection.collection[0].id);

    expect(watchlistCollectionBrokerServiceSpy.removeList).toHaveBeenCalled();
  });

  it('#updateListMeta should call broker', () => {
    setupGetItemMock(testCollection);
    watchlistCollectionBrokerServiceSpy.addOrUpdateLists.and.returnValue(new Subject());

    service.updateListMeta(testCollection.collection[0].id, { title: 'new title' });

    expect(watchlistCollectionBrokerServiceSpy.addOrUpdateLists).toHaveBeenCalled();
  });

  it('#addItemsToList should call broker', () => {
    setupGetItemMock(testCollection);
    watchlistCollectionBrokerServiceSpy.addOrUpdateLists.and.returnValue(new Subject());

    service.addItemsToList(testCollection.collection[0].id, [{
      symbol: 'symbol',
      exchange: 'SPB'
    }]);

    expect(watchlistCollectionBrokerServiceSpy.addOrUpdateLists).toHaveBeenCalled();
  });

  it('#removeItemsFromList should call broker', () => {
    setupGetItemMock(testCollection);
    watchlistCollectionBrokerServiceSpy.addOrUpdateLists.and.returnValue(new Subject());

    service.removeItemsFromList(testCollection.collection[0].id, testCollection.collection[0].items.map(x => x.recordId!));

    expect(watchlistCollectionBrokerServiceSpy.addOrUpdateLists).toHaveBeenCalled();
  });
});
