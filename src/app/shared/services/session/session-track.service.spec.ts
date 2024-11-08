import { TestBed } from '@angular/core/testing';

import { SessionTrackService } from './session-track.service';
import { BehaviorSubject } from "rxjs";
import { TerminalSettings } from "../../models/terminal-settings/terminal-settings.model";
import { map } from "rxjs/operators";
import { ActivityTrackerService } from "./activity-tracker.service";
import {TerminalSettingsService} from "../terminal-settings.service";
import { SessionInstantTranslatableNotificationsService } from "./session-instant-translatable-notifications.service";
import { SESSION_CONTEXT } from "../auth/session-context";

describe('SessionTrackService', () => {
  let service: SessionTrackService;

  let activityTrackerServiceSpy: any;
  let terminalSettingsServiceSpy: any;
  let sessionContextSpy: any;
  let instantNotificationsServiceSpy: any;
  const userIdleDurationMinMock = new BehaviorSubject<number>(1 / 60);
  const lastActivityTimeMock = new BehaviorSubject<number | null>(null);
  const nowDateMock = Date.now();

  beforeEach(() => {
    activityTrackerServiceSpy = jasmine.createSpyObj('ActivityTrackerService', ['startTracking', 'stopTracking', 'lastActivityUnixTime$']);
    terminalSettingsServiceSpy = jasmine.createSpyObj('TerminalSettingsService', ['getSettings']);
    sessionContextSpy = jasmine.createSpyObj('SessionContext', ['fullLogout']);
    instantNotificationsServiceSpy = jasmine.createSpyObj('SessionInstantTranslatableNotificationsService', ['endOfSession', 'removeNotification']);

    terminalSettingsServiceSpy.getSettings.and.returnValue(
      userIdleDurationMinMock.pipe(
        map(x => ({ userIdleDurationMin: x, isLogoutOnUserIdle: true }) as TerminalSettings))
    );
    activityTrackerServiceSpy.lastActivityUnixTime$ = lastActivityTimeMock;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivityTrackerService,
          useValue: activityTrackerServiceSpy
        },
        {
          provide: TerminalSettingsService,
          useValue: terminalSettingsServiceSpy
        },
        {
          provide: SESSION_CONTEXT,
          useValue: sessionContextSpy
        },
        {
          provide: SessionInstantTranslatableNotificationsService,
          useValue: instantNotificationsServiceSpy
        }
      ]
    });
    service = TestBed.inject(SessionTrackService);
  });

  beforeEach(() => {
    try {
      jasmine.clock().install();
    } catch {}
    jasmine.clock().mockDate(new Date(nowDateMock));
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should NOT logout on activity', () => {
    const usrIdleDuration = 2 / 60;
    const usrIdleDurationMs = Math.round(usrIdleDuration * 60 * 1000);

    userIdleDurationMinMock.next(usrIdleDuration);
    lastActivityTimeMock.next(Math.round(nowDateMock + usrIdleDurationMs - 100));

    service.startTracking();
    jasmine.clock().tick(usrIdleDurationMs);

    expect(sessionContextSpy.fullLogout).not.toHaveBeenCalled();
  });

  it('should logout on inactivity', () => {
    const usrIdleDuration = 2 / 60;
    const usrIdleDurationMs = Math.round(usrIdleDuration * 60 * 1000);

    userIdleDurationMinMock.next(usrIdleDuration);
    lastActivityTimeMock.next(Math.round(nowDateMock - usrIdleDurationMs));

    service.startTracking();
    jasmine.clock().tick(usrIdleDurationMs);

    expect(sessionContextSpy.fullLogout).toHaveBeenCalled();
  });

  it('should NOT warning on activity', () => {
    const usrIdleDuration = 2 / 60;
    const usrIdleDurationMs = Math.round(usrIdleDuration * 60 * 1000);

    userIdleDurationMinMock.next(usrIdleDuration);
    lastActivityTimeMock.next(Math.round(nowDateMock + usrIdleDurationMs - 100));

    service.startTracking();
    jasmine.clock().tick(usrIdleDurationMs);

    expect(instantNotificationsServiceSpy.endOfSession).not.toHaveBeenCalled();
  });

  it('should warning on inactivity', () => {
    const usrIdleDuration = 2 / 60;
    const usrIdleDurationMs = Math.round(usrIdleDuration * 60 * 1000);

    userIdleDurationMinMock.next(usrIdleDuration);
    lastActivityTimeMock.next(Math.round(nowDateMock - usrIdleDurationMs));

    service.startTracking();
    jasmine.clock().tick(usrIdleDurationMs);

    expect(instantNotificationsServiceSpy.endOfSession).toHaveBeenCalled();
  });

  it('should warning on inactivity and hide warning on activity', () => {
    instantNotificationsServiceSpy.endOfSession.and.callFake(
      (a: any, b: (e: any) => void) => b?.({ messageId: 1})
    ); // Needs to assign lastWarningId property ID of warning

    const usrIdleDuration = 2 / 60;
    const usrIdleDurationMs = Math.round(usrIdleDuration * 60 * 1000);

    userIdleDurationMinMock.next(usrIdleDuration);
    lastActivityTimeMock.next(Math.round(nowDateMock - usrIdleDurationMs));

    service.startTracking();
    jasmine.clock().tick(usrIdleDurationMs);

    expect(instantNotificationsServiceSpy.endOfSession).toHaveBeenCalled();

    lastActivityTimeMock.next(Date.now());
    jasmine.clock().tick(100);

    expect(instantNotificationsServiceSpy.removeNotification).toHaveBeenCalled();
  });
});
