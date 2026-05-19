import {
  inject,
  Injectable
} from '@angular/core';
import {NzNotificationDataOptions} from "ng-zorro-antd/notification";
import {BaseTranslatorService} from '../../translations/services/base-translator.service';
import {SideNotificationsService} from '../../side-notifications/services/side-notifications.service';
import {SessionInstantNotificationType} from '../../terminal-settings/terminal-settings.types';

@Injectable()
export class SessionInstantTranslatableNotificationsService extends BaseTranslatorService {
  protected translationsPath = 'shared/session-notifications';

  private readonly notificationsService = inject(SideNotificationsService);

  private lastWarningId?: string;

  endOfSession(): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      SessionInstantNotificationType.EndOfSession,
      'warning',
      t(['warningMessageTitle'], {fallback: 'Завершение сеанса'}),
      t(['warningMessageContent'], {fallback: 'Текущий сеанс будет завершен из-за бездействия пользователя'}),
      {nzDuration: 0} as NzNotificationDataOptions,
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
