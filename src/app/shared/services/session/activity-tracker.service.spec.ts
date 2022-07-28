import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ActivityTrackerService } from './activity-tracker.service';
import { skip, take } from "rxjs";

describe('ActivityTrackerService', () => {
  let service: ActivityTrackerService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityTrackerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start tracking', () => {
    const addEventListenerSpy = spyOn(window, 'addEventListener');
    const removeEventListenerSpy = spyOn(window, 'removeEventListener');

    service.startTracking();
    expect(addEventListenerSpy).toHaveBeenCalledTimes(4);
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', service);
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', service);
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', service);
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', service);

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(4);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', service);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', service);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', service);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', service);
  });

  it('should stop tracking', () => {
    const removeEventListenerSpy = spyOn(window, 'removeEventListener');

    service.stopTracking();

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(4);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', service);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', service);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', service);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', service);
  });

  it('should write new time in lastActivityUnixTime$ while handle event', fakeAsync(() => {
    service.startTracking();

    service.lastActivityUnixTime$
      .pipe(
        skip(1),
        take(1)
      )
      .subscribe(time => {
      expect(time).toBe(new Date().getTime());
    });

    service.handleEvent();
    tick();
  }));
});
