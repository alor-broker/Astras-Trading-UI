import { NotificationsProvider } from '../../notifications/services/notifications-provider';
import {
  BehaviorSubject,
  Observable,
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
  filter,
  map,
  startWith
} from 'rxjs/operators';
import { mapWith } from '../../../shared/utils/observable-helper';
import { addHours } from '../../../shared/utils/datetime';
import { NewFeedback } from '../models/feedback.model';

@Injectable()
export class FeedbackNotificationsProvider implements NotificationsProvider {
  private readonly readNotification$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly modalService: ModalService,
    private readonly feedbackService: FeedbackService
  ) {
  }

  getNotifications(): Observable<NotificationMeta[]> {
    const lastCheck = this.feedbackService.getLastFeedbackCheck();
    if (!lastCheck) {
      this.feedbackService.setLastFeedbackCheck();
    }

    const defaultDelayHours = 1;
    const defaultDelayMilliseconds = defaultDelayHours * 3600 * 1000;

    const now = new Date();
    let startTime = addHours(new Date(now), defaultDelayHours);
    if (!!lastCheck) {
      if ((now.getTime() - lastCheck) > defaultDelayMilliseconds) {
        startTime = now;
      }
    }

    return timer(startTime, defaultDelayMilliseconds).pipe(
      tap(() => this.readNotification$.next(false)),
      switchMap(() => this.feedbackService.requestFeedback()),
      tap(() => this.feedbackService.setLastFeedbackCheck()),
      filter(f => !!f),
      mapWith(() => this.readNotification$, (feedback, isRead) => ({ feedback, isRead })),
      map(s => {
        if (s.isRead) {
          return [];
        }

        return [
          {
            id: GuidGenerator.newGuid(),
            date: new Date(),
            title: 'Оценить приложение',
            description: 'Поделитесь своим мнением о приложении',
            showDate: true,
            isRead: false,
            open: () => {
              const params: NewFeedback = {
                feedbackCode: s.feedback!.feedbackCode,
                description: s.feedback!.description
              };

              this.modalService.openVoteModal(params);
            },
            markAsRead: () => this.markReadNotification()
          } as NotificationMeta
        ];
      }),
      shareReplay(1),
      startWith([])
    );
  }

  private markReadNotification() {
    this.readNotification$.next(true);
  }
}
