import { TestBed } from '@angular/core/testing';

import { LocalStorageService } from './local-storage.service';
import { GuidGenerator } from '../utils/guid';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
    service = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#setItem should save to localStorage', (done) => {
    const expectedItemKey = 'testKey';
    const expectedItem = {
      id: 'testItemId',
      testNumberField: 1,
      testBoolField: true
    };

    spyOn(localStorage, 'setItem').and.callFake((key, value) => {
        expect(key).toEqual(expectedItemKey);
        expect(value).toEqual(JSON.stringify(expectedItem));
        done();
      }
    );

    service.setItem(expectedItemKey, expectedItem);
  });

  it('#getItem should return value from localStorage', () => {
    const expectedItemKey = 'testKey';
    const expectedItem = {
      id: 'testItemId',
      testNumberField: 1,
      testBoolField: true
    };

    spyOn(localStorage, 'getItem')
      .and.callFake((key) => key === expectedItemKey ? JSON.stringify(expectedItem) : null);

    const value = service.getItem<typeof expectedItem>(expectedItemKey);

    expect(JSON.stringify(value)).toEqual(JSON.stringify(expectedItem));
  });

  it('#getItem should return previously saved value', () => {
    const expectedItemKey = 'testKey';
    const expectedItem = {
      id: 'testItemId',
      testNumberField: 1,
      testBoolField: true
    };

    service.setItem(expectedItemKey, expectedItem);
    const value = service.getItem<typeof expectedItem>(expectedItemKey);

    expect(JSON.stringify(value)).toEqual(JSON.stringify(expectedItem));
  });

  it('#getItem should return undefined if item has not been saved', () => {
    const value = service.getItem<object>(GuidGenerator.newGuid());

    expect(value).toBeUndefined();
  });

  it('#removeItem item should be removed', () => {
    const expectedItemKey = 'testKey';
    const expectedItem = {
      id: 'testItemId',
      testNumberField: 1,
      testBoolField: true
    };

    service.setItem(expectedItemKey, expectedItem);
    service.removeItem(expectedItemKey);

    const value = service.getItem<typeof expectedItem>(expectedItemKey);

    expect(value).toBeUndefined();
  });
});
