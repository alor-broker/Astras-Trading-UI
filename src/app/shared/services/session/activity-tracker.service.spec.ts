import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ActivityTrackerService } from './activity-tracker.service';
import { skip, take } from "rxjs";

fdescribe('ActivityTrackerService', () => {
  let service: ActivityTrackerService;
  let windowSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    windowSpy = {
      addEventListener: jasmine.createSpy('addEventListener').and.callThrough(),
      removeEventListener: jasmine.createSpy('removeEventListener').and.callThrough()
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: 'Window',
          useValue: windowSpy
        }
      ]
    });
    service = TestBed.inject(ActivityTrackerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start tracking', () => {
    service.startTracking();
    expect(windowSpy.addEventListener).toHaveBeenCalledTimes(4);
    expect(windowSpy.addEventListener).toHaveBeenCalledWith('mousemove', service);
    expect(windowSpy.addEventListener).toHaveBeenCalledWith('scroll', service);
    expect(windowSpy.addEventListener).toHaveBeenCalledWith('keydown', service);
    expect(windowSpy.addEventListener).toHaveBeenCalledWith('touchmove', service);

    expect(windowSpy.removeEventListener).toHaveBeenCalledTimes(4);
    expect(windowSpy.removeEventListener).toHaveBeenCalledWith('mousemove', service);
    expect(windowSpy.removeEventListener).toHaveBeenCalledWith('scroll', service);
    expect(windowSpy.removeEventListener).toHaveBeenCalledWith('keydown', service);
    expect(windowSpy.removeEventListener).toHaveBeenCalledWith('touchmove', service);
  });

  it('should stop tracking', () => {
    service.stopTracking();

    expect(windowSpy.removeEventListener).toHaveBeenCalledTimes(4);
    expect(windowSpy.removeEventListener).toHaveBeenCalledWith('mousemove', service);
    expect(windowSpy.removeEventListener).toHaveBeenCalledWith('scroll', service);
    expect(windowSpy.removeEventListener).toHaveBeenCalledWith('keydown', service);
    expect(windowSpy.removeEventListener).toHaveBeenCalledWith('touchmove', service);
  });

  it('should write new time in lastActivityUnixTime$ while handle event', fakeAsync(() => {
    service.startTracking();

    service.lastActivityUnixTime$
      .pipe(skip(1), take(1))
      .subscribe(time => {
      expect(time).toBe(new Date().getTime());
    });

    service.handleEvent();
    tick();
  }));
});
