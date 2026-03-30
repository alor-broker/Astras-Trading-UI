import { Injectable, inject } from '@angular/core';
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
import { mapWith } from "../../utils/observable-helper";
import { TerminalSettingsService } from "../terminal-settings.service";
import { SessionInstantTranslatableNotificationsService } from "./session-instant-translatable-notifications.service";
import {
  SESSION_CONTEXT,
  SessionContext
} from "../auth/session-context";

@Injectable({
  providedIn: 'any'
})
export class SessionTrackService {
  private readonly activityTrackerService = inject(ActivityTrackerService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly sessionContext = inject<SessionContext>(SESSION_CONTEXT);
  private readonly instantNotificationService = inject(SessionInstantTranslatableNotificationsService);

  private trackingSubscription?: Subscription;

  startTracking(): void {
    this.stopTracking();
    this.activityTrackerService.startTracking();

    const userIdleDuration$ = this.terminalSettingsService.getSettings()
      .pipe(
        filter(s => s.isLogoutOnUserIdle ?? false),
        map(settings => Math.round((settings.userIdleDurationMin ?? 15) * 60 * 1000)),
        shareReplay()
      );

    this.trackingSubscription = this.setupSessionCheck(userIdleDuration$);
    this.trackingSubscription.add(this.setupWarningCheck(userIdleDuration$));
  }

  stopTracking(): void {
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
        this.sessionContext.fullLogout();
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
          this.instantNotificationService.removeNotification();
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

  private getNextCheckPeriod(period: number, lastActivityTime: number | null): number {
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

  private getWarningPeriod(userIdleDuration: number): number {
    return userIdleDuration <= (60 * 1000)
      ? Math.min(30 * 1000, userIdleDuration)
      : 60 * 1000;
  }

  private showWarningMessage(): void {
    this.instantNotificationService.removeNotification();
    this.instantNotificationService.endOfSession();
  }
}
