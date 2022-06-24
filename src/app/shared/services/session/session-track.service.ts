import { Injectable } from '@angular/core';
import { ActivityTrackerService } from "./activity-tracker.service";
import {
  combineLatest,
  filter,
  Observable,
  shareReplay,
  Subject,
  Subscription,
  take,
  tap,
  timer,
  withLatestFrom
} from "rxjs";
import { map } from "rxjs/operators";
import { AuthService } from "../../../shared/services/auth.service";
import { mapWith } from "../../../shared/utils/observable-helper";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { NzNotificationDataOptions } from "ng-zorro-antd/notification/typings";
import { TerminalSettingsService } from "../../../modules/terminal-settings/services/terminal-settings.service";

@Injectable({
  providedIn: 'root'
})
export class SessionTrackService {
  private trackingSubscription?: Subscription;
  private lastWarningId?: string;

  constructor(
    private readonly activityTrackerService: ActivityTrackerService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly authService: AuthService,
    private readonly notificationService: NzNotificationService
  ) {
  }

  startTracking() {
    this.stopTracking();
    this.activityTrackerService.startTracking();

    const userIdleDuration$ = this.terminalSettingsService.getSettings().pipe(
      map(settings => Math.round((settings.userIdleDurationMin ?? 15) * 60 * 1000)),
      shareReplay()
    );

    this.trackingSubscription = this.setupSessionCheck(userIdleDuration$);
    this.trackingSubscription.add(this.setupWarningCheck(userIdleDuration$));
  }

  stopTracking() {
    this.trackingSubscription?.unsubscribe();
    this.activityTrackerService.stopTracking();
  }

  private setupSessionCheck(userIdleDuration$: Observable<number>): Subscription {
    const nextSessionCheckMoment$ = new Subject<number | null>();

    const subscription = this.getTimeTrackPipe(
      userIdleDuration$.pipe(
        tap(() => nextSessionCheckMoment$.next(null))
      ),
      nextSessionCheckMoment$
    ).subscribe(track => {
      if (this.isNeedToCompleteSession(track.checkPeriod, track.lastActivityUnixTime)) {
        this.authService.logout();
        return;
      }

      nextSessionCheckMoment$.next(this.getNextCheckPeriod(track.checkPeriod, track.lastActivityUnixTime));
    });

    nextSessionCheckMoment$.next(null);

    return subscription;
  }

  private setupWarningCheck(userIdleDuration$: Observable<number>): Subscription {
    const nextWarningCheckMoment$ = new Subject<number | null>();

    const warningPeriod$ = userIdleDuration$.pipe(
      map(userIdleDuration => userIdleDuration - this.getWarningPeriod(userIdleDuration)),
      map(warningPeriod => warningPeriod < 1000 ? 1000 : warningPeriod),
      tap(() => nextWarningCheckMoment$.next(null))
    );

    const subscription = this.getTimeTrackPipe(
      warningPeriod$,
      nextWarningCheckMoment$
    ).subscribe(track => {
      if (this.isNeedToCompleteSession(track.checkPeriod, track.lastActivityUnixTime)) {
        this.showWarningMessage();
        this.activityTrackerService.lastActivityUnixTime$.pipe(
          filter(x => !this.isNeedToCompleteSession(5000, x)),
          take(1)
        ).subscribe(() => {
            this.removeWarningMessage();
            nextWarningCheckMoment$.next(this.getNextCheckPeriod(track.checkPeriod, track.lastActivityUnixTime));
          }
        );

        return;
      }

      nextWarningCheckMoment$.next(this.getNextCheckPeriod(track.checkPeriod, track.lastActivityUnixTime));
    });

    nextWarningCheckMoment$.next(null);

    return subscription;
  }

  private getTimeTrackPipe(defaultCheckPeriod$: Observable<number>, nextCheckPeriod$: Observable<number | null>): Observable<{ checkPeriod: number, lastActivityUnixTime: number | null }> {
    return combineLatest([defaultCheckPeriod$, nextCheckPeriod$]).pipe(
      map(([defaultCheckPeriod, nextCheckPeriod]) => ({
        nextCheckPeriod,
        defaultCheckPeriod
      })),
      mapWith(periods => timer(periods.nextCheckPeriod ?? periods.defaultCheckPeriod), periods => periods.defaultCheckPeriod),
      withLatestFrom(this.activityTrackerService.lastActivityUnixTime$),
      map(([checkPeriod, lastActivityUnixTime]) => ({
        checkPeriod,
        lastActivityUnixTime
      }))
    );
  }

  private getNextCheckPeriod(period: number, lastActivityTime: number | null) {
    if (lastActivityTime == null) {
      return period;
    } else {
      const passedTime = new Date().getTime() - lastActivityTime;
      const nextPeriod = period - passedTime;
      return nextPeriod <= 0 ? period : nextPeriod;
    }
  }

  private isNeedToCompleteSession(userIdleDuration: number, lastActivityTime: number | null): boolean {
    if (lastActivityTime == null) {
      return true;
    }

    return (new Date().getTime() - lastActivityTime) > userIdleDuration;
  }

  private getWarningPeriod(userIdleDuration: number) {
    return userIdleDuration <= (60 * 1000)
      ? Math.min(30 * 1000, userIdleDuration)
      : 60 * 1000;
  }

  private showWarningMessage() {
    this.removeWarningMessage();
    this.lastWarningId = this.notificationService.warning(
      'Завершение сеанса',
      'Текущий сеанс будет завершен из-за бездействия пользователя',
      {
        nzDuration: 0
      } as NzNotificationDataOptions
    ).messageId;
  }

  private removeWarningMessage() {
    if (!!this.lastWarningId) {
      this.notificationService.remove(this.lastWarningId);
      this.lastWarningId = undefined;
    }
  }
}

