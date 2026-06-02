import {
  inject,
  Injectable
} from '@angular/core';
import {
  Observable,
  of
} from "rxjs";
import {map} from "rxjs/operators";
import {HttpClient} from '@angular/common/http';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {URGENT_NOTIFICATIONS_URL_PROVIDER} from '../../../config/api-url-providers';
import {
  Notification,
  NotificationsResponse
} from '../types/urgent-notifications.types';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';

@Injectable()
export class UrgentNotificationsService {
  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly urgentNotificationsUrlProvider = inject(URGENT_NOTIFICATIONS_URL_PROVIDER);

  getNotifications(): Observable<NotificationsResponse | null> {
    if (this.urgentNotificationsUrlProvider.urgentNotificationsUrl == null) {
      return of(null);
    }

    return this.httpClient.get<NotificationsResponse>(this.urgentNotificationsUrlProvider.urgentNotificationsUrl).pipe(
      catchHttpError<NotificationsResponse | null>(null, this.errorHandlerService),
      map(r => {
        if (r == null) {
          return null;
        }

        return {
          ...r,
          cards: (r.cards ?? []).map((card: Notification) => {
            return {
              ...card,
              activeFrom: card.activeFrom != null ? new Date(card.activeFrom) : null,
              activeTo: card.activeTo != null ? new Date(card.activeTo) : null
            } satisfies Notification;
          })
        } satisfies NotificationsResponse;
      })
    );
  }
}
