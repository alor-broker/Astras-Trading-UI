import { NotificationsProvider } from '../../notifications/services/notifications-provider';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  timer
} from 'rxjs';
import { NotificationMeta } from '../../notifications/models/notification.model';
import { GuidGenerator } from '../../../shared/utils/guid';
import { ModalService } from '../../../shared/services/modal.service';
import { Injectable } from '@angular/core';
import { FeedbackService } from './feedback.service';
import {
  map,
  startWith
} from 'rxjs/operators';
import {
  addHours,
  addMinutes
} from '../../../shared/utils/datetime';
import { NewFeedback } from '../models/feedback.model';

@Injectable()
export class FeedbackNotificationsProvider implements NotificationsProvider {
  private readonly readFeedbackMeta$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly modalService: ModalService,
    private readonly feedbackService: FeedbackService
  ) {
    this.feedbackService.unansweredFeedbackRemoved$
      .subscribe(() => this.readFeedbackMeta$.next(true));
  }

  getNotifications(): Observable<NotificationMeta[]> {
    const feedbackMeta = this.feedbackService.getSavedFeedbackMeta();

    if (!feedbackMeta) {
      this.feedbackService.setLastFeedbackCheck();
    }

    const defaultDelayHours = 1;
    const defaultDelayMilliseconds = defaultDelayHours * 3600 * 1000;

    const now = new Date();
    let startTime = addHours(new Date(now), defaultDelayHours);

    if (!!feedbackMeta) {
      if (feedbackMeta.lastUnansweredFeedback) {
        startTime = now;
      }
      else if (!!feedbackMeta.lastCheck && (now.getTime() - feedbackMeta.lastCheck) > defaultDelayMilliseconds) {
        startTime = addMinutes(new Date(now), 5);
      }
    }

    return combineLatest([
      timer(startTime, defaultDelayMilliseconds),
      this.readFeedbackMeta$
    ])
      .pipe(
        switchMap(() => {
          const feedbackMeta = this.feedbackService.getSavedFeedbackMeta();
          if (feedbackMeta?.lastUnansweredFeedback) {
            return of(feedbackMeta.lastUnansweredFeedback);
          }
          else if (!feedbackMeta?.lastCheck || (new Date().getTime() - feedbackMeta.lastCheck) >= defaultDelayMilliseconds) {
            return this.feedbackService.requestFeedback().pipe(
              map(x => !x ? null : ({ ...x, isRead: false, date: Date.now() })),
              tap(x => this.feedbackService.setUnansweredFeedback(x))
            );
          }
          else {
            return of(null);
          }
        }),
        tap(() => this.feedbackService.setLastFeedbackCheck()),
        map(f => {
          if (!f) {
            return [];
          }

          return [
            {
              id: GuidGenerator.newGuid(),
              date: !!f.date ? new Date(f.date) : new Date(),
              title: 'Оценить приложение',
              description: 'Поделитесь своим мнением о приложении',
              showDate: true,
              isRead: f.isRead,
              open: () => {
                const params: NewFeedback = {
                  code: f.code,
                  description: f.description
                };

                this.modalService.openVoteModal(params);
              },
              markAsRead: () => {
                this.feedbackService.setUnansweredFeedback({
                  ...f,
                  isRead: true
                });

                this.readFeedbackMeta$.next(true);
              }
            } as NotificationMeta
          ];
        }),
        shareReplay(1),
        startWith([])
      );
  }
}
