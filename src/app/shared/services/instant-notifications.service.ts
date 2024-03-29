import { Injectable } from '@angular/core';
import {
  InstantNotificationsSettings,
  InstantNotificationType
} from '../models/terminal-settings/terminal-settings.model';
import {
  Observable,
  shareReplay,
  take
} from 'rxjs';
import { map } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {TerminalSettingsService} from "./terminal-settings.service";
import { NzNotificationDataOptions, NzNotificationRef } from "ng-zorro-antd/notification/typings";

@Injectable({
  providedIn: 'root'
})
export class InstantNotificationsService {
  private notificationsSettings$: Observable<InstantNotificationsSettings> | null = null;

  constructor(
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly notificationService: NzNotificationService
  ) {
  }

  showNotification(
    notificationType: InstantNotificationType,
    displayType: 'info' | 'success' | 'error' | 'warning',
    title: string,
    content: string,
    notificationParams?: NzNotificationDataOptions,
    notificationCallback?: (n: NzNotificationRef) => void
  ): void {
    this.getSettings().pipe(
      take(1)
    ).subscribe(s => {
      if (!!s.hiddenNotifications?.find(x => x === notificationType)) {
        return;
      }

      let notificationRef: NzNotificationRef | null = null;

      if (displayType === 'info') {
        notificationRef = this.notificationService.info(title, content, notificationParams);
      }

      if (displayType === 'success') {
        notificationRef = this.notificationService.success(title, content, notificationParams);
      }

      if (displayType === 'warning') {
        notificationRef = this.notificationService.warning(title, content, notificationParams);
      }

      if (displayType === 'error') {
        notificationRef = this.notificationService.error(title, content, notificationParams);
      }

      notificationCallback?.(notificationRef!);
    });
  }

  removeNotification(id?: string): void {
    this.notificationService.remove(id);
  }

  private getSettings(): Observable<InstantNotificationsSettings> {
    if (!this.notificationsSettings$) {
      this.notificationsSettings$ = this.terminalSettingsService.getSettings().pipe(
        map(s => s.instantNotificationsSettings!),
        shareReplay(1)
      );
    }

    return this.notificationsSettings$;
  }
}
