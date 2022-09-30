import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { WidgetsDataProviderService } from './widgets-data-provider.service';

describe('WidgetsDataProviderService', () => {
  let service: WidgetsDataProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WidgetsDataProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add new data provider and get existing', () => {
    const dataProviderName = 'anyName';
    expect(service.getDataProvider(dataProviderName)).toBeFalsy();

    service.addNewDataProvider(dataProviderName);

    expect(service.getDataProvider(dataProviderName)).toBeTruthy();
  });

  it('should set providers value', fakeAsync(() => {
    const dataProviderName = 'anyName';
    const expectedValue = 'anyValue';

    service.addNewDataProvider(dataProviderName);

    service.getDataProvider(dataProviderName)?.subscribe(val => expect(val).toBe(expectedValue));

    service.setDataProviderValue(dataProviderName, expectedValue);
    tick();
  }));
});
