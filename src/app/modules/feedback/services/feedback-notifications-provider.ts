import {NotificationsProvider} from '../../notifications/services/notifications-provider';
import {BehaviorSubject, combineLatest, Observable, of, shareReplay, switchMap, tap, timer} from 'rxjs';
import {NotificationMeta} from '../../notifications/models/notification.model';
import {GuidGenerator} from '../../../shared/utils/guid';
import {ModalService} from '../../../shared/services/modal.service';
import {Injectable} from '@angular/core';
import {FeedbackService} from './feedback.service';
import {map, startWith} from 'rxjs/operators';
import {addMinutes} from '../../../shared/utils/datetime';
import {NewFeedback, UnansweredFeedback} from '../models/feedback.model';
import {TranslatorService} from "../../../shared/services/translator.service";
import {TimezoneConverterService} from "../../../shared/services/timezone-converter.service";

@Injectable()
export class FeedbackNotificationsProvider implements NotificationsProvider {
  private readonly readFeedbackMeta$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly modalService: ModalService,
    private readonly feedbackService: FeedbackService,
    private readonly translatorService: TranslatorService,
    private readonly timezoneConverterService: TimezoneConverterService
  ) {
    this.feedbackService.unansweredFeedbackRemoved$
      .subscribe(() => this.readFeedbackMeta$.next(true));
  }

  getNotifications(): Observable<NotificationMeta[]> {
    return combineLatest([
      this.getUnansweredFeedback(),
      this.translatorService.getTranslator('feedback'),
      this.timezoneConverterService.getConverter()
    ]).pipe(
      map(([feedback, translator, converter]) => {
        if (!feedback) {
          return [];
        }

        const feedbackDate = !!feedback.date ? new Date(feedback.date) : new Date();

        return [
          {
            id: GuidGenerator.newGuid(),
            date: converter.toTerminalDate(feedbackDate),
            title: translator(['title']),
            description: feedback.description.length > 100
              ? feedback.description.substring(0, 100) + '...'
              : feedback.description,
            showDate: true,
            isRead: feedback.isRead,
            open: () => {
              const params: NewFeedback = {
                code: feedback.code,
                description: feedback.description
              };

              this.modalService.openVoteModal(params);
            },
            markAsRead: () => {
              this.feedbackService.setUnansweredFeedback({
                ...feedback,
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

  private getUnansweredFeedback(): Observable<UnansweredFeedback | null> {
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
          } else if (!feedbackMeta?.lastCheck || (new Date().getTime() - feedbackMeta.lastCheck) >= checkIntervalMs) {
            return this.feedbackService.requestFeedback().pipe(
              map(x => !x ? null : ({...x, isRead: false, date: Date.now()})),
              tap(() => this.feedbackService.setLastFeedbackCheck()),
              tap(x => this.feedbackService.setUnansweredFeedback(x))
            );
          } else {
            return of(null);
          }
        })
      );
  }
}
