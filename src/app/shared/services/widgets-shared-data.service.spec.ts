import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { WidgetsSharedDataService } from "./widgets-shared-data.service";
import {skip, take} from "rxjs";

describe('WidgetsSharedDataService', () => {
  let service: WidgetsSharedDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WidgetsSharedDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set providers value', fakeAsync(() => {
    const dataProviderName = 'anyName';
    const expectedValue = 'anyValue';

    service.getDataProvideValues(dataProviderName)
      .pipe(
        skip(1),
        take(1)
      ).subscribe(val => expect(val).toBe(expectedValue));

    service.setDataProviderValue(dataProviderName, expectedValue);
    tick();
  }));
});
