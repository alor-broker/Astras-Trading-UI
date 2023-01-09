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
import { addMinutes } from '../../../shared/utils/datetime';
import { NewFeedback } from '../models/feedback.model';
import { TranslatorService } from "../../../shared/services/translator.service";
import { mapWith } from "../../../shared/utils/observable-helper";

@Injectable()
export class FeedbackNotificationsProvider implements NotificationsProvider {
  private readonly readFeedbackMeta$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly modalService: ModalService,
    private readonly feedbackService: FeedbackService,
    private readonly translatorService: TranslatorService
  ) {
    this.feedbackService.unansweredFeedbackRemoved$
      .subscribe(() => this.readFeedbackMeta$.next(true));
  }

  getNotifications(): Observable<NotificationMeta[]> {
    const feedbackMeta = this.feedbackService.getSavedFeedbackMeta();

    const initialDelayMinutes = 3;
    const checkIntervalMs = 30 * 60 * 1000;

    const now = new Date();
    let startTime = addMinutes(new Date(now), initialDelayMinutes);

    if (feedbackMeta && feedbackMeta.lastUnansweredFeedback) {
      startTime = now;
    }

    return combineLatest([
      timer(startTime, 60 * 1000),
      this.readFeedbackMeta$
    ])
      .pipe(
        switchMap(() => {
          const feedbackMeta = this.feedbackService.getSavedFeedbackMeta();
          if (feedbackMeta?.lastUnansweredFeedback) {
            return of(feedbackMeta.lastUnansweredFeedback);
          }
          else if (!feedbackMeta?.lastCheck || (new Date().getTime() - feedbackMeta.lastCheck) >= checkIntervalMs) {
            return this.feedbackService.requestFeedback().pipe(
              map(x => !x ? null : ({ ...x, isRead: false, date: Date.now() })),
              tap(() => this.feedbackService.setLastFeedbackCheck()),
              tap(x => this.feedbackService.setUnansweredFeedback(x))
            );
          }
          else {
            return of(null);
          }
        }),
        mapWith(
          () => this.translatorService.getTranslator('feedback'),
          (f, t) => ({ f, t })
        ),
        map(({ f, t }) => {
          if (!f) {
            return [];
          }

          return [
            {
              id: GuidGenerator.newGuid(),
              date: !!f.date ? new Date(f.date) : new Date(),
              title: t(['title']),
              description: f.description.length > 100
                ? f.description.substring(0, 100) + '...'
                : f.description,
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
