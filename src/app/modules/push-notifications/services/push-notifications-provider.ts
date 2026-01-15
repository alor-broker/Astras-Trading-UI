import { DestroyRef, Injectable, inject } from '@angular/core';
import { NotificationsProvider } from '../../notifications/services/notifications-provider';
import { combineLatest, Observable, shareReplay } from 'rxjs';
import { NotificationMeta } from '../../notifications/models/notification.model';
import { PushNotificationsService } from "./push-notifications.service";
import { map } from "rxjs/operators";
import { isPortfoliosEqual } from "../../../shared/utils/portfolios";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { TimezoneConverterService } from "../../../shared/services/timezone-converter.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { UserPortfoliosService } from "../../../shared/services/user-portfolios.service";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";

interface SavedPushNotification {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  isRead: boolean;
}

@Injectable()
export class PushNotificationsProvider implements NotificationsProvider {
  private readonly pushNotificationsService = inject(PushNotificationsService);
  private readonly userPortfoliosService = inject(UserPortfoliosService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly timezoneConverterService = inject(TimezoneConverterService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly pushNotificationsStorageKey = 'push-notifications';

  private notifications$?: Observable<NotificationMeta[]>;

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

  private initRequiredSubscriptions(): void {
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

  private initNotificationsSync(): void {
    this.pushNotificationsService.getMessages().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(payload => {
      let messageData = payload.notification;

      if(messageData == null && payload.data?.body != null) {
        messageData = JSON.parse(payload.data.body).notification as { title: string, body: string } | undefined;
      }

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

  private setIsRead(notification: SavedPushNotification): void {
    const currentNotifications = this.getSavedNotifications();
    const updated = [
      ...currentNotifications.filter(n => n.id !== notification.id),
    ];

    this.localStorageService.setItem(this.pushNotificationsStorageKey, updated);
  }
}
