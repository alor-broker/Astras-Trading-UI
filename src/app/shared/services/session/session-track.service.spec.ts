import { TestBed } from '@angular/core/testing';

import { SessionTrackService } from './session-track.service';
import { BehaviorSubject } from "rxjs";
import { TerminalSettings } from "../../models/terminal-settings/terminal-settings.model";
import { map } from "rxjs/operators";
import { ActivityTrackerService } from "./activity-tracker.service";
import { TerminalSettingsService } from "../../../modules/terminal-settings/services/terminal-settings.service";
import { AuthService } from "../auth.service";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { NzNotificationRef } from "ng-zorro-antd/notification/typings";

describe('SessionTrackService', () => {
  let service: SessionTrackService;

  let activityTrackerServiceSpy: any;
  let terminalSettingsServiceSpy: any;
  let authServiceSpy: any;
  let notificationServiceSpy: any;
  const userIdleDurationMinMock = new BehaviorSubject<number>(1 / 60);
  const lastActivityTimeMock = new BehaviorSubject<number | null>(null);
  const nowDateMock = Date.now();

  beforeEach(() => {
    activityTrackerServiceSpy = jasmine.createSpyObj('ActivityTrackerService', ['startTracking', 'stopTracking', 'lastActivityUnixTime$']);
    terminalSettingsServiceSpy = jasmine.createSpyObj('TerminalSettingsService', ['getSettings']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    notificationServiceSpy = jasmine.createSpyObj('NzNotificationService', ['warning', 'remove']);

    terminalSettingsServiceSpy.getSettings.and.returnValue(
      userIdleDurationMinMock.pipe(
        map(x => ({ userIdleDurationMin: x }) as TerminalSettings))
    );
    activityTrackerServiceSpy.lastActivityUnixTime$ = lastActivityTimeMock;
    notificationServiceSpy.warning.and.returnValue({ messageId: 'messageId' } as NzNotificationRef);

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
          provide: AuthService,
          useValue: authServiceSpy
        },
        {
          provide: NzNotificationService,
          useValue: notificationServiceSpy
        },
      ]
    });
    service = TestBed.inject(SessionTrackService);
  });

  beforeEach(() => {
    jasmine.clock().install();
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

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
  });

  it('should logout on inactivity', () => {
    const usrIdleDuration = 2 / 60;
    const usrIdleDurationMs = Math.round(usrIdleDuration * 60 * 1000);

    userIdleDurationMinMock.next(usrIdleDuration);
    lastActivityTimeMock.next(Math.round(nowDateMock - usrIdleDurationMs));

    service.startTracking();
    jasmine.clock().tick(usrIdleDurationMs);

    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  it('should NOT warning on activity', () => {
    const usrIdleDuration = 2 / 60;
    const usrIdleDurationMs = Math.round(usrIdleDuration * 60 * 1000);

    userIdleDurationMinMock.next(usrIdleDuration);
    lastActivityTimeMock.next(Math.round(nowDateMock + usrIdleDurationMs - 100));

    service.startTracking();
    jasmine.clock().tick(usrIdleDurationMs);

    expect(notificationServiceSpy.warning).not.toHaveBeenCalled();
  });

  it('should warning on inactivity', () => {
    const usrIdleDuration = 2 / 60;
    const usrIdleDurationMs = Math.round(usrIdleDuration * 60 * 1000);

    userIdleDurationMinMock.next(usrIdleDuration);
    lastActivityTimeMock.next(Math.round(nowDateMock - usrIdleDurationMs));

    service.startTracking();
    jasmine.clock().tick(usrIdleDurationMs);

    expect(notificationServiceSpy.warning).toHaveBeenCalled();
  });

  it('should warning on inactivity and hide warning on activity', () => {
    const usrIdleDuration = 2 / 60;
    const usrIdleDurationMs = Math.round(usrIdleDuration * 60 * 1000);

    userIdleDurationMinMock.next(usrIdleDuration);
    lastActivityTimeMock.next(Math.round(nowDateMock - usrIdleDurationMs));

    service.startTracking();
    jasmine.clock().tick(usrIdleDurationMs);

    expect(notificationServiceSpy.warning).toHaveBeenCalled();

    lastActivityTimeMock.next(Date.now());
    jasmine.clock().tick(100);

    expect(notificationServiceSpy.remove).toHaveBeenCalled();
  });
});
