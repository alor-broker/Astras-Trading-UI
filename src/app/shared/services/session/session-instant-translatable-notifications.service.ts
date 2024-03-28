import { Injectable } from '@angular/core';
import { BaseTranslatorService } from "../base-translator.service";
import { InstantNotificationsService } from "../instant-notifications.service";
import { TranslatorService } from "../translator.service";
import { SessionInstantNotificationType } from "../../models/terminal-settings/terminal-settings.model";
import { NzNotificationDataOptions, NzNotificationRef } from "ng-zorro-antd/notification/typings";

@Injectable({
  providedIn: 'root'
})
export class SessionInstantTranslatableNotificationsService
extends BaseTranslatorService {
  protected translationsPath = 'shared/session-notifications';

  constructor(
    protected readonly notificationsService: InstantNotificationsService,
    protected readonly translatorService: TranslatorService
  ) {
    super(translatorService);
  }

  endOfSession(notificationParams: NzNotificationDataOptions, notificationCallback: (n: NzNotificationRef) => void): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      SessionInstantNotificationType.EndOfSession,
      'warning',
      t(['warningMessageTitle'], { fallback: 'Завершение сеанса' }),
      t(['warningMessageContent'], { fallback: 'Текущий сеанс будет завершен из-за бездействия пользователя' }),
      notificationParams,
      notificationCallback
    ));
  }

}
