import {DestroyRef, Injectable} from '@angular/core';
import {NotificationsProvider} from '../../notifications/services/notifications-provider';
import {combineLatest, Observable, shareReplay} from 'rxjs';
import {NotificationMeta} from '../../notifications/models/notification.model';
import {PushNotificationsService} from "./push-notifications.service";
import {filter, map} from "rxjs/operators";
import {TerminalSettingsService} from "../../terminal-settings/services/terminal-settings.service";
import {isPortfoliosEqual} from "../../../shared/utils/portfolios";
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import {TimezoneConverterService} from "../../../shared/services/timezone-converter.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {UserPortfoliosService} from "../../../shared/services/user-portfolios.service";

interface SavedPushNotification {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  isRead: boolean;
}

@Injectable()
export class PushNotificationsProvider implements NotificationsProvider {
  private readonly pushNotificationsStorageKey = 'push-notifications';

  private notifications$?: Observable<NotificationMeta[]>;

  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly userPortfoliosService: UserPortfoliosService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly localStorageService: LocalStorageService,
    private readonly timezoneConverterService: TimezoneConverterService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  getNotifications(): Observable<NotificationMeta[]> {
    if (!this.notifications$) {
      this.initRequiredSubscriptions();
      this.initNotificationsSync();
      this.notifications$ = this.getPushNotifications();
    }

    return this.notifications$;
  }

  private getPushNotifications(): Observable<NotificationMeta[]> {
    return combineLatest([
      this.timezoneConverterService.getConverter(),
      this.localStorageService.getItemStream<SavedPushNotification[]>(this.pushNotificationsStorageKey)
    ]).pipe(
      map(([converter, notifications]) => {
        if (!notifications) {
          return [];
        }

        return notifications.map(n => ({
            id: n.id,
            title: n.title,
            description: n.description,
            date: converter.toTerminalDate(new Date(n.timestamp)),
            isRead: n.isRead,
            showDate: true,
            markAsRead: () => this.setIsRead(n)
          } as NotificationMeta)
        );
      }),
      shareReplay(1)
    );
  }

  private initRequiredSubscriptions() {
    combineLatest([
      this.userPortfoliosService.getPortfolios(),
      this.terminalSettingsService.getSettings()
    ]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([allPortfolios, terminalSettings]) => {
      const portfolios = allPortfolios.map(p => ({portfolio: p.portfolio, exchange: p.exchange}));
      const disableNotificationPortfolios = terminalSettings.instantNotificationsSettings?.hiddenPortfoliosForNotifications ?? [];

      const filteredPortfolios = portfolios.filter(p => !disableNotificationPortfolios.find(ep => isPortfoliosEqual(p, ep)));

      this.pushNotificationsService.subscribeToOrdersExecute(filteredPortfolios).subscribe();
    });
  }

  private initNotificationsSync() {
    this.pushNotificationsService.getMessages().pipe(
      filter(payload => !!payload?.data?.body),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(payload => {
      const messageData = JSON.parse(payload!.data!.body!).notification;
      if (!messageData) {
        return;
      }

      const notifications = [
        ...this.getSavedNotifications(),
        {
          id: payload.messageId,
          title: messageData.title,
          description: messageData.body,
          timestamp: Date.now(),
          isRead: false
        } as SavedPushNotification
      ];

      const notificationsToSave = notifications
        .sort((a, b) => a.timestamp - b.timestamp).slice(-50);

      this.localStorageService.setItem(this.pushNotificationsStorageKey, notificationsToSave);
    });
  }

  private getSavedNotifications(): SavedPushNotification[] {
    return this.localStorageService.getItem<SavedPushNotification[]>(this.pushNotificationsStorageKey) ?? [];
  }

  private setIsRead(notification: SavedPushNotification) {
    const currentNotifications = this.getSavedNotifications();
    const updated = [
      ...currentNotifications.filter(n => n.id !== notification.id),
    ];

    this.localStorageService.setItem(this.pushNotificationsStorageKey, updated);
  }
}
