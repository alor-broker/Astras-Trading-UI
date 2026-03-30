import { Injectable, inject } from '@angular/core';
import { BaseTranslatorService } from "../../../shared/services/base-translator.service";
import { InstantNotificationsService } from "../../../shared/services/instant-notifications.service";
import { TranslatorService } from "../../../shared/services/translator.service";
import {
  ScalperOrderBookInstantNotificationType
} from "../../../shared/models/terminal-settings/terminal-settings.model";

@Injectable({
  providedIn: 'root'
})
export class ScalperOrderBookInstantTranslatableNotificationsService
extends BaseTranslatorService {
  private readonly notificationsService = inject(InstantNotificationsService);
  protected readonly translatorService: TranslatorService;

  protected translationsPath = 'scalper-order-book/scalper-order-book-notifications';

  constructor() {
    const translatorService = inject(TranslatorService);

    super(translatorService);

    this.translatorService = translatorService;
  }

  emptyPositions(): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      ScalperOrderBookInstantNotificationType.EmptyPositions,
      'error',
      t(['emptyPositionsErrorTitle'], { fallback: 'Нет позиций' }),
      t(['emptyPositionsErrorContent'], { fallback: 'Позиции для установки стоп-лосс отсутствуют'})
    ));
  }
}
