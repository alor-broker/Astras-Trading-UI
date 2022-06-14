import { TestBed } from '@angular/core/testing';

import { WatchlistCollectionService } from './watchlist-collection.service';
import { TestData } from '../../../shared/utils/testing';
import { WatchlistCollection } from '../models/watchlist.model';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';

describe('WatchListCollectionService', () => {
  let httpController: HttpTestingController;
  let httpClient: HttpClient;
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

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

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        WatchlistCollectionService,
        { provide: ErrorHandlerService, useValue: errorHandlerSpy }
      ]
    });

    service = TestBed.inject(WatchlistCollectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#getWatchlistCollection should read value from localStorage', () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.stringify(testCollection);
    });

    const value = JSON.stringify(service.getWatchlistCollection());
    expect(value).toEqual(JSON.stringify(testCollection));
  });

  it('#getWatchlistCollection should return default collection if missing', () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return null;
    });

    const value = service.getWatchlistCollection();
    expect(value.collection.find(x => x.isDefault)).toBeDefined();
  });

  it('#getListItems should return list for correct listId', () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.stringify(testCollection);
    });

    const targetListId = testCollection.collection[0].id;
    const value = JSON.stringify(service.getListItems(targetListId));

    expect(value).toEqual(JSON.stringify(testCollection.collection[0].items));
  });

  it('#getListItems should return undefined for incorrect listId', () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.stringify(testCollection);
    });

    const value = service.getListItems('-1');

    expect(value).toBeUndefined();
  });

  it('#createNewList should update localStorage', () => {
    let isUpdated = false;
    spyOn(localStorage, 'setItem').and.callFake((key: string) => {
      if (key === watchlistCollectionStorage) {
        isUpdated = true;
      }
    });

    service.createNewList('test list', []);

    expect(isUpdated).toBeTrue();
  });

  it('#createNewList should notify about changes', (done) => {
    spyOn(localStorage, 'setItem');

    service.collectionChanged$.subscribe(() => {
      expect().nothing();
      done();
    });

    service.createNewList('test list', []);
  });

  it('#removeList should update localStorage', () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.stringify(testCollection);
    });

    let isUpdated = false;
    spyOn(localStorage, 'setItem').and.callFake((key: string) => {
      if (key === watchlistCollectionStorage) {
        isUpdated = true;
      }
    });

    service.removeList(testCollection.collection[0].id);

    expect(isUpdated).toBeTrue();
  });

  it('#removeList should notify about changes', (done) => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.stringify(testCollection);
    });

    spyOn(localStorage, 'setItem');

    service.collectionChanged$.subscribe(() => {
      expect().nothing();
      done();
    });

    service.removeList(testCollection.collection[0].id);
  });

  it('#updateListMeta should update localStorage', () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.stringify(testCollection);
    });

    let isUpdated = false;
    spyOn(localStorage, 'setItem').and.callFake((key: string) => {
      if (key === watchlistCollectionStorage) {
        isUpdated = true;
      }
    });

    service.updateListMeta(testCollection.collection[0].id, { title: 'new title' });

    expect(isUpdated).toBeTrue();
  });

  it('#updateListMeta should notify about changes', (done) => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.stringify(testCollection);
    });

    spyOn(localStorage, 'setItem');

    service.collectionChanged$.subscribe(() => {
      expect().nothing();
      done();
    });

    service.updateListMeta(testCollection.collection[0].id, { title: 'new title' });
  });

  it('#addItemsToList should update localStorage', () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.stringify(testCollection);
    });

    let isUpdated = false;
    spyOn(localStorage, 'setItem').and.callFake((key: string) => {
      if (key === watchlistCollectionStorage) {
        isUpdated = true;
      }
    });

    service.addItemsToList(testCollection.collection[0].id, [{ symbol: 'symbol', exchange: 'SPB' }]);

    expect(isUpdated).toBeTrue();
  });

  it('#addItemsToList should notify about changes', (done) => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.stringify(testCollection);
    });

    spyOn(localStorage, 'setItem');

    service.collectionChanged$.subscribe(() => {
      expect().nothing();
      done();
    });

    service.addItemsToList(testCollection.collection[0].id, [{ symbol: 'symbol', exchange: 'SPB' }]);
  });

  it('#removeItemsFromList should update localStorage', () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.stringify(testCollection);
    });

    let isUpdated = false;
    spyOn(localStorage, 'setItem').and.callFake((key: string) => {
      if (key === watchlistCollectionStorage) {
        isUpdated = true;
      }
    });

    service.removeItemsFromList(testCollection.collection[0].id, testCollection.collection[0].items);

    expect(isUpdated).toBeTrue();
  });

  it('#removeItemsFromList should notify about changes', (done) => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key !== watchlistCollectionStorage) {
        return null;
      }

      return JSON.stringify(testCollection);
    });

    spyOn(localStorage, 'setItem');

    service.collectionChanged$.subscribe(() => {
      expect().nothing();
      done();
    });

    service.removeItemsFromList(testCollection.collection[0].id, testCollection.collection[0].items);
  });
});
