import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";
import {
  Observable,
  of
} from "rxjs";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { map } from "rxjs/operators";

export interface NotificationsResponse {
  active: boolean;
  cards: Notification[];
}

export interface Notification {
  id: number;
  title: string | null;
  cardOrder: number | null;
  link: string | null;
  activeFrom?: Date | null;
  activeTo?: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class UrgentNotificationsService {
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly environmentService = inject(EnvironmentService);

  getNotifications(): Observable<NotificationsResponse | null> {
    if (this.environmentService.cmsUrl == null || this.environmentService.cmsUrl == '') {
      return of(null);
    }

    return this.httpClient.get<NotificationsResponse>(`${this.environmentService.cmsUrl}/v1/site/cards/ca_hotnews_banners`).pipe(
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
