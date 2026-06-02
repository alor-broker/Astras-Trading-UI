import {Provider} from '@angular/core';
import {FeedbackService} from './services/feedback.service';
import {NOTIFICATIONS_PROVIDER} from '../header-notifications/services/header-notifications-service.types';
import {FeedbackNotificationsProvider} from './services/feedback-notifications-provider';

export function provideFeedback(): Provider[] {
  return [
    FeedbackService,
    {
      provide: NOTIFICATIONS_PROVIDER,
      useClass: FeedbackNotificationsProvider,
      multi: true
    },
  ];
}
