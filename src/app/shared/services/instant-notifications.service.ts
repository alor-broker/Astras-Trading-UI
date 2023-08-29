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
    displayType: 'info' | 'success' | 'error',
    title: string,
    content: string
  ) {
    this.getSettings().pipe(
      take(1)
    ).subscribe(s => {
      if (!!s.hiddenNotifications?.find(x => x === notificationType)) {
        return;
      }

      if (displayType === 'info') {
        this.notificationService.info(title, content);
      }

      if (displayType === 'success') {
        this.notificationService.success(title, content);
      }

      if (displayType === 'error') {
        this.notificationService.error(title, content);
      }
    });
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
