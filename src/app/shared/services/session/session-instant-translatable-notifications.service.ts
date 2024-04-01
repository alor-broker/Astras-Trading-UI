import { Injectable } from '@angular/core';
import { BaseTranslatorService } from "../base-translator.service";
import { InstantNotificationsService } from "../instant-notifications.service";
import { TranslatorService } from "../translator.service";
import { SessionInstantNotificationType } from "../../models/terminal-settings/terminal-settings.model";
import { NzNotificationDataOptions } from "ng-zorro-antd/notification/typings";

@Injectable({
  providedIn: 'root'
})
export class SessionInstantTranslatableNotificationsService
extends BaseTranslatorService {
  protected translationsPath = 'shared/session-notifications';
  private lastWarningId?: string;

  constructor(
    private readonly notificationsService: InstantNotificationsService,
    protected readonly translatorService: TranslatorService
  ) {
    super(translatorService);
  }

  endOfSession(): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      SessionInstantNotificationType.EndOfSession,
      'warning',
      t(['warningMessageTitle'], { fallback: 'Завершение сеанса' }),
      t(['warningMessageContent'], { fallback: 'Текущий сеанс будет завершен из-за бездействия пользователя' }),
      { nzDuration: 0 } as NzNotificationDataOptions,
      n => this.lastWarningId = n.messageId
    ));
  }

  removeNotification(): void {
    if (this.lastWarningId != null) {
      this.notificationsService.removeNotification(this.lastWarningId);
      this.lastWarningId = undefined;
    }
  }
}
