import {
  inject,
  Injectable
} from '@angular/core';
import {BaseTranslatorService} from '@terminal-core-lib/features/translations/services/base-translator.service';
import {SideNotificationsService} from '@terminal-core-lib/features/side-notifications/services/side-notifications.service';
import {ScalperOrderBookInstantNotificationType} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';

@Injectable()
export class ScalperOrderBookInstantTranslatableNotificationsService extends BaseTranslatorService {
  protected translationsPath = 'scalper-order-book/scalper-order-book-notifications';

  private readonly notificationsService = inject(SideNotificationsService);

  emptyPositions(): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      ScalperOrderBookInstantNotificationType.EmptyPositions,
      'error',
      t(['emptyPositionsErrorTitle'], {fallback: 'Нет позиций'}),
      t(['emptyPositionsErrorContent'], {fallback: 'Позиции для установки стоп-лосс отсутствуют'})
    ));
  }
}
