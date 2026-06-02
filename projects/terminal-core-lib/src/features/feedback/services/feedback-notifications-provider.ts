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
import {
  inject,
  Injectable
} from '@angular/core';
import {FeedbackService} from './feedback.service';
import {
  map,
  startWith
} from 'rxjs/operators';
import {NotificationsProvider} from '../../header-notifications/services/header-notifications-service.types';
import {TranslatorService} from '../../translations/services/translator.service';
import {TimezoneConverterService} from '../../timezones/services/timezone-converter.service';
import {NotificationMeta} from '../../header-notifications/header-notifications.types';
import {GuidGenerator} from '../../../common/utils/guid-generator';
import {
  NewFeedback,
  UnansweredFeedback
} from '../types/feedback.types';
import {addMinutes} from 'date-fns';

@Injectable()
export class FeedbackNotificationsProvider implements NotificationsProvider {
  private readonly feedbackService = inject(FeedbackService);

  private readonly translatorService = inject(TranslatorService);

  private readonly timezoneConverterService = inject(TimezoneConverterService);

  private readonly readFeedbackMeta$ = new BehaviorSubject<boolean>(false);

  constructor() {
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

        const feedbackDate = feedback.date != null ? new Date(feedback.date!) : new Date();

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

              this.feedbackService.showVoteDialog(params);
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
          } else if (feedbackMeta?.lastCheck == null || (new Date().getTime() - feedbackMeta!.lastCheck!) >= checkIntervalMs) {
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
