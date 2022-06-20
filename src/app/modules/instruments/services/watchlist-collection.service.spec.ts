import { TestBed } from '@angular/core/testing';

import { WatchlistCollectionService } from './watchlist-collection.service';
import { TestData } from '../../../shared/utils/testing';
import { WatchlistCollection } from '../models/watchlist.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { LocalStorageService } from "../../../shared/services/local-storage.service";

describe('WatchListCollectionService', () => {
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
  let localStorageServiceSpy: any;

  let service: WatchlistCollectionService;
  const watchlistCollectionStorage = 'watchlistCollection';

  const testCollection = {
    collection: [{
      id: '123',
      title: 'Test List',
      isDefault: false,
      items: TestData.instruments.map(x => ({ ...x }))
    },
      {
        id: '321',
        title: 'Test List',
        isDefault: true,
        items: TestData.instruments.map(x => ({ ...x }))
      }]
  } as WatchlistCollection;

  const setupGetItemMock = (returnValue: WatchlistCollection | null = null) => {
    localStorageServiceSpy.getItem.and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.parse(JSON.stringify(returnValue)) as WatchlistCollection;
    });
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        WatchlistCollectionService,
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy }
      ]
    });

    service = TestBed.inject(WatchlistCollectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#getWatchlistCollection should read value from localStorage', () => {
    setupGetItemMock(testCollection);

    const value = JSON.stringify(service.getWatchlistCollection());
    expect(value).toEqual(JSON.stringify(testCollection));
  });

  it('#getWatchlistCollection should return default collection if missing', () => {
    setupGetItemMock(null);

    const value = service.getWatchlistCollection();
    expect(value.collection.find(x => x.isDefault)).toBeDefined();
  });

  it('#getListItems should return list for correct listId', () => {
    setupGetItemMock(testCollection);

    const targetListId = testCollection.collection[0].id;
    const value = JSON.stringify(service.getListItems(targetListId));

    expect(value).toEqual(JSON.stringify(testCollection.collection[0].items));
  });

  it('#getListItems should return undefined for incorrect listId', () => {
    setupGetItemMock(testCollection);

    const value = service.getListItems('-1');

    expect(value).toBeUndefined();
  });

  it('#createNewList should update localStorage', () => {
    service.createNewList('test list', []);

    expect(localStorageServiceSpy.setItem).toHaveBeenCalledWith(watchlistCollectionStorage, jasmine.anything());
  });

  it('#createNewList should notify about changes', (done) => {
    service.collectionChanged$.subscribe(() => {
      expect().nothing();
      done();
    });

    service.createNewList('test list', []);
  });

  it('#removeList should update localStorage', () => {
    setupGetItemMock(testCollection);

    service.removeList(testCollection.collection[0].id);

    expect(localStorageServiceSpy.setItem).toHaveBeenCalledWith(watchlistCollectionStorage, jasmine.anything());
  });

  it('#removeList should notify about changes', (done) => {
    setupGetItemMock(testCollection);

    service.collectionChanged$.subscribe(() => {
      expect().nothing();
      done();
    });

    service.removeList(testCollection.collection[0].id);
  });

  it('#updateListMeta should update localStorage', () => {
    setupGetItemMock(testCollection);

    service.updateListMeta(testCollection.collection[0].id, { title: 'new title' });

    expect(localStorageServiceSpy.setItem).toHaveBeenCalledWith(watchlistCollectionStorage, jasmine.anything());
  });

  it('#updateListMeta should notify about changes', (done) => {
    setupGetItemMock(testCollection);

    service.collectionChanged$.subscribe(() => {
      expect().nothing();
      done();
    });

    service.updateListMeta(testCollection.collection[0].id, { title: 'new title' });
  });

  it('#addItemsToList should update localStorage', () => {
    setupGetItemMock(testCollection);

    service.addItemsToList(testCollection.collection[0].id, [{
      symbol: 'symbol',
      exchange: 'SPB'
    }]);

    expect(localStorageServiceSpy.setItem).toHaveBeenCalledWith(watchlistCollectionStorage, jasmine.anything());
  });

  it('#addItemsToList should notify about changes', (done) => {
    setupGetItemMock(testCollection);

    service.collectionChanged$.subscribe(() => {
      expect().nothing();
      done();
    });

    service.addItemsToList(testCollection.collection[0].id, [{
      symbol: 'symbol',
      exchange: 'SPB'
    }]);
  });

  it('#removeItemsFromList should update localStorage', () => {
    setupGetItemMock(testCollection);

    service.removeItemsFromList(testCollection.collection[0].id, testCollection.collection[0].items);

    expect(localStorageServiceSpy.setItem).toHaveBeenCalledWith(watchlistCollectionStorage, jasmine.anything());
  });

  it('#removeItemsFromList should notify about changes', (done) => {
    setupGetItemMock(testCollection);

    service.collectionChanged$.subscribe(() => {
      expect().nothing();
      done();
    });

    service.removeItemsFromList(testCollection.collection[0].id, testCollection.collection[0].items);
  });
});
