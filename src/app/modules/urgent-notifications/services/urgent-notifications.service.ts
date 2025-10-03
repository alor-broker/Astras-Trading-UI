import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { Observable } from "rxjs";
import { catchHttpError } from "../../../shared/utils/observable-helper";

export interface NotificationsResponse {
  active: boolean;
  cards: Notification[];
}

export interface Notification {
  id: number;
  text: string | null;
  title: string;
  cardOrder: number;
  link: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UrgentNotificationsService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly environmentService: EnvironmentService
  ) {
  }

  getNotifications(): Observable<NotificationsResponse | null> {
    return this.httpClient.get<NotificationsResponse>(`https://www.alorbroker.ru/cmsapi/v1/site/cards/ca_hotnews_banners`).pipe(
      catchHttpError<NotificationsResponse | null>(null, this.errorHandlerService)
    );
  }
}
