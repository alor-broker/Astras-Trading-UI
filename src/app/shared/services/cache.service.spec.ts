import {
  discardPeriodicTasks,
  fakeAsync,
  TestBed
} from '@angular/core/testing';

import { CacheService } from './cache.service';
import { of } from 'rxjs';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheService);
  });

  beforeEach(() => {
    try {
      jasmine.clock().install();
    } catch {}
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call #loadData if data missing', () => {
    const loadDataSpy = jasmine.createSpy('loadData').and.returnValue(of({}));

    service.wrap(
      () => 'missingKey1',
      loadDataSpy
    ).subscribe();

    expect(loadDataSpy).toHaveBeenCalled();
    loadDataSpy.calls.reset();

    service.wrap(
      () => 'missingKey2',
      loadDataSpy
    ).subscribe();

    expect(loadDataSpy).toHaveBeenCalled();
  });

  it('should NOT call #loadData if data loaded and not expired', () => {
    const startDate = Date.now();
    const expirationTimeout = 20;

    const loadDataSpy = jasmine.createSpy('loadData').and.returnValue(of({}));
    const key = 'key1';

    service.wrap(
      () => key,
      loadDataSpy,
      {
        expirationTimeoutSec: 30
      }
    ).subscribe();

    expect(loadDataSpy).toHaveBeenCalled();

    loadDataSpy.calls.reset();
    jasmine.clock().mockDate(new Date(startDate + expirationTimeout / 2 * 1000));

    service.wrap(
      () => key,
      loadDataSpy
    ).subscribe();

    expect(loadDataSpy).not.toHaveBeenCalled();
  });

  it('should call #loadData if data expired', fakeAsync(() => {
      const startDate = Date.now();
      const loadDataSpy = jasmine.createSpy('loadData').and.returnValue(of({}));
      const key = 'key1';
      const expirationTimeout = 15;

      service.wrap(
        () => key,
        loadDataSpy,
        {
          expirationTimeoutSec: expirationTimeout
        }
      ).subscribe();

      expect(loadDataSpy).toHaveBeenCalled();
      loadDataSpy.calls.reset();

      service.wrap(
        () => key,
        loadDataSpy
      ).subscribe();

      expect(loadDataSpy).not.toHaveBeenCalled();

      jasmine.clock().mockDate(new Date(startDate + expirationTimeout * 2 * 1000));

      service.wrap(
        () => key,
        loadDataSpy
      ).subscribe();

      expect(loadDataSpy).toHaveBeenCalled();

      discardPeriodicTasks();
    })
  );

  it('should call #loadData if previous data null', fakeAsync(() => {
      const loadDataSpy = jasmine.createSpy('loadData').and.returnValue(of(null));
      const key = 'key1';
      const expirationTimeout = 15;

      service.wrap(
        () => key,
        loadDataSpy,
        {
          expirationTimeoutSec: expirationTimeout
        }
      ).subscribe();

      expect(loadDataSpy).toHaveBeenCalled();
      loadDataSpy.calls.reset();

      service.wrap(
        () => key,
        loadDataSpy
      ).subscribe();

      expect(loadDataSpy).toHaveBeenCalled();

      discardPeriodicTasks();
    })
  );
});
