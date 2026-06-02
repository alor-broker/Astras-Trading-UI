import {TestScheduler} from 'rxjs/testing';
import {Observable} from 'rxjs';
import {mapWith} from './map-with';

describe('mapWith', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should combine each source value with its projected inner value', () => {
    scheduler.run(({cold, expectObservable}) => {
      const source$ = cold('a--b|', {a: 1, b: 2});
      const project = (value: number): Observable<number> => cold('(x|)', {x: value * 10});

      const result$ = source$.pipe(mapWith(project, (sourceValue, innerValue) => sourceValue + innerValue));

      // 1 + 10 = 11, 2 + 20 = 22
      expectObservable(result$).toBe('a--b|', {a: 11, b: 22});
    });
  });

  it('should cancel a pending inner when a new source value arrives (switchMap semantics)', () => {
    scheduler.run(({cold, expectObservable}) => {
      const source$ = cold('ab|', {a: 1, b: 2});
      const project = (value: number): Observable<number> => cold('--x|', {x: value});

      const result$ = source$.pipe(mapWith(project, (sourceValue, innerValue) => innerValue));

      // The inner for 'a' (would emit at frame 2) is cancelled when 'b' arrives at frame 1;
      // only 'b' inner emits, at frame 3.
      expectObservable(result$).toBe('---x|', {x: 2});
    });
  });
});
