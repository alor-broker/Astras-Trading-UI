import {TestScheduler} from 'rxjs/testing';
import {withRefresh} from './with-refresh';

describe('withRefresh', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should re-emit the source on the refresh period while the app is active', () => {
    scheduler.run(({cold, expectObservable}) => {
      const source$ = cold('(s|)', {s: 'data'});
      const isActive$ = cold('t--f|', {t: true, f: false});

      const result$ = source$.pipe(withRefresh<string>(2, isActive$, 0));

      // Active from frame 0: timer(0, 2) re-runs the source at frames 0 and 2;
      // at frame 3 the app goes inactive (switches to EMPTY) and the stream completes at frame 4.
      expectObservable(result$).toBe('s-s-|', {s: 'data'});
    });
  });

  it('should emit nothing while the app is inactive', () => {
    scheduler.run(({cold, expectObservable}) => {
      const source$ = cold('(s|)', {s: 'data'});
      const isActive$ = cold('(f|)', {f: false});

      const result$ = source$.pipe(withRefresh<string>(2, isActive$, 0));

      expectObservable(result$).toBe('|');
    });
  });

  it('should wait for startDue before the first emission', () => {
    scheduler.run(({cold, expectObservable}) => {
      const source$ = cold('(s|)', {s: 'data'});
      const isActive$ = cold('t---f|', {t: true, f: false});

      const result$ = source$.pipe(withRefresh<string>(3, isActive$, 2));

      // startDue = 2 → first emission at frame 2; the next tick at frame 5 is cancelled
      // by inactivity at frame 4; the stream completes when isActive$ completes at frame 5.
      expectObservable(result$).toBe('--s--|', {s: 'data'});
    });
  });
});
