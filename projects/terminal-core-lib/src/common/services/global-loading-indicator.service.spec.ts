import {TestBed} from '@angular/core/testing';
import {GlobalLoadingIndicatorService} from './global-loading-indicator.service';

describe('GlobalLoadingIndicatorService', () => {
  let service: GlobalLoadingIndicatorService;

  beforeEach(() => {
    // State updates are deferred through setTimeout — fake timers make them deterministic.
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [GlobalLoadingIndicatorService]
    });

    service = TestBed.inject(GlobalLoadingIndicatorService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not be loading initially', () => {
    let isLoading: boolean | undefined;
    const sub = service.isLoading$.subscribe(v => isLoading = v);
    sub.unsubscribe();

    expect(isLoading).toBe(false);
  });

  it('should report loading after a registration and stop after its release', () => {
    const states: boolean[] = [];
    const sub = service.isLoading$.subscribe(v => states.push(v));

    service.registerLoading('request-1');
    vi.runOnlyPendingTimers();

    service.releaseLoading('request-1');
    vi.runOnlyPendingTimers();

    sub.unsubscribe();
    expect(states).toEqual([false, true, false]);
  });

  it('should stay loading until every registration is released', () => {
    let isLoading: boolean | undefined;
    const sub = service.isLoading$.subscribe(v => isLoading = v);

    service.registerLoading('a');
    service.registerLoading('b');
    vi.runOnlyPendingTimers();

    service.releaseLoading('a');
    vi.runOnlyPendingTimers();
    expect(isLoading).toBe(true);

    service.releaseLoading('b');
    vi.runOnlyPendingTimers();
    expect(isLoading).toBe(false);

    sub.unsubscribe();
  });
});
