import {Injectable} from '@angular/core';
import {NotificationsProvider} from '../../notifications/services/notifications-provider';
import { BehaviorSubject, Observable, switchMap, take } from 'rxjs';
import {NotificationMeta} from '../../notifications/models/notification.model';
import {PushNotificationsService} from "./push-notifications.service";
import {Store} from "@ngrx/store";
import {selectPortfoliosState} from "../../../store/portfolios/portfolios.selectors";
import {filter, map} from "rxjs/operators";
import {EntityStatus} from "../../../shared/models/enums/entity-status";
import {PortfolioExtended} from "../../../shared/models/user/portfolio-extended.model";
import { TerminalSettingsService } from "../../terminal-settings/services/terminal-settings.service";
import { isPortfoliosEqual } from "../../../shared/utils/portfolios";

@Injectable()
export class PushNotificationsProvider implements NotificationsProvider {
  private notifications$?: BehaviorSubject<NotificationMeta[]>;

  private allMessages = new Map<string, NotificationMeta>();

  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly store: Store,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  getNotifications(): Observable<NotificationMeta[]> {
    if (!this.notifications$) {
      this.initNotifications();
    }

    return this.notifications$!.asObservable();
  }

  private initNotifications() {
    this.notifications$ = new BehaviorSubject<NotificationMeta[]>([]);

    this.store.select(selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(portfoliosState => Object.values(portfoliosState.entities) as PortfolioExtended[]),
      take(1),
      map(allPortfolios => allPortfolios.map(p => ({portfolio: p.portfolio, exchange: p.exchange}))),
      switchMap(allPortfolios => this.terminalSettingsService.getSettings()
          .pipe(
            map(s => s.instantNotificationsSettings?.hiddenPortfoliosForNotifications ?? []),
            map(excludedPortfolios => allPortfolios.filter(p => !excludedPortfolios.find(ep => isPortfoliosEqual(p, ep)))),
          ),
      ),
      switchMap(portfolios => this.pushNotificationsService.subscribeToOrdersExecute(portfolios)),
      switchMap(() => this.pushNotificationsService.getMessages())
    ).subscribe((payload) => {
      if (!payload?.data?.body) {
        return;
      }

      const messageData = JSON.parse(payload.data.body).notification;

      if (!messageData) {
        return;
      }

      const notification: NotificationMeta = {
        id: payload.messageId,
        date: new Date(),
        title: messageData.title,
        description: messageData.body,
        isRead: false,
        showDate: true,
        markAsRead: () => {
          this.allMessages.set(payload.messageId, {
            ...notification,
            isRead: true
          });

          this.notifications$!.next(Array.from(this.allMessages.values()));
        }
      };

      this.allMessages.set(payload.messageId, notification);

      this.notifications$!.next(Array.from(this.allMessages.values()));
    });
  }
}
