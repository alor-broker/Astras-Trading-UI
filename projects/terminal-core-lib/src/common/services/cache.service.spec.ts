import {TestBed} from '@angular/core/testing';
import {
  Observable,
  of
} from 'rxjs';
import {CacheService} from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    // asyncScheduler emissions and Date-based expiration are driven by timers —
    // fake them so the test is deterministic (testing-lib rule 17).
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [CacheService]
    });

    service = TestBed.inject(CacheService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const key = (): string => 'instruments';

  it('should load data once and share it among subscribers with the same key', () => {
    let loads = 0;
    const load = (): Observable<string> => new Observable<string>(subscriber => {
      loads++;
      subscriber.next('data');
      subscriber.complete();
    });
    const results: string[] = [];

    service.wrap(key, load).subscribe(v => results.push(v));
    service.wrap(key, load).subscribe(v => results.push(v));
    vi.runOnlyPendingTimers();

    expect(loads).toBe(1);
    expect(results).toEqual(['data', 'data']);
  });

  it('should load independently for different keys', () => {
    let loads = 0;
    const load = (): Observable<string> => {
      loads++;
      return of('data');
    };

    service.wrap(() => 'a', load).subscribe();
    service.wrap(() => 'b', load).subscribe();
    vi.runOnlyPendingTimers();

    expect(loads).toBe(2);
  });

  it('should not cache a falsy result and should reload on the next request', () => {
    let loads = 0;
    const load = (): Observable<string | null> => {
      loads++;
      return of(loads === 1 ? null : 'data');
    };
    let result: string | null | undefined;

    service.wrap(key, load).subscribe();
    vi.runOnlyPendingTimers();
    service.wrap(key, load).subscribe(v => result = v);
    vi.runOnlyPendingTimers();

    expect(loads).toBe(2);
    expect(result).toBe('data');
  });

  it('should reload after the cached entry expires', () => {
    let loads = 0;
    const load = (): Observable<string> => {
      loads++;
      return of('data');
    };

    service.wrap(key, load, {expirationTimeoutSec: 30}).subscribe();
    vi.runOnlyPendingTimers();

    service.wrap(key, load, {expirationTimeoutSec: 30}).subscribe();
    vi.runOnlyPendingTimers();
    expect(loads).toBe(1);

    vi.advanceTimersByTime(31_000);
    service.wrap(key, load, {expirationTimeoutSec: 30}).subscribe();
    vi.runOnlyPendingTimers();
    expect(loads).toBe(2);
  });
});
