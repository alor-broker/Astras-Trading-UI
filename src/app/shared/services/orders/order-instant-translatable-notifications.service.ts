import { Injectable, inject } from '@angular/core';
import { InstantNotificationsService } from "../instant-notifications.service";
import { TranslatorService } from "../translator.service";
import { BaseTranslatorService } from "../base-translator.service";
import { httpLinkRegexp } from "../../utils/regexps";
import { OrdersInstantNotificationType } from "../../models/terminal-settings/terminal-settings.model";
import { OrderCommandResult } from "../../models/orders/new-order.model";

@Injectable({
  providedIn: 'root'
})
export class OrderInstantTranslatableNotificationsService
  extends BaseTranslatorService {
  private readonly notificationsService = inject(InstantNotificationsService);
  protected readonly translatorService: TranslatorService;

  protected translationsPath = 'shared/orders-notifications';

  constructor() {
    const translatorService = inject(TranslatorService);

    super(translatorService);

    this.translatorService = translatorService;
  }

  orderCreated(orderNumber: string): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderCreated,
      'success',
      t(['orderCreatedLabel'], { fallback: 'Заявка выставлена' }),
      t(['orderCreatedContent'], {
        fallback: `Заявка успешно выставлена, её номер на бирже: \n ${orderNumber}`,
        orderNumber
      })
    ));
  }

  orderSubmitFailed(result: OrderCommandResult): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderSubmitFailed,
      'error',
      t(['orderSubmitFailedLabel'], { fallback: 'Ошибка выставления заявки' }),
      this.prepareErrorMessage(result.message)
    ));
  }

  orderFilled(orderId: string): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderFilled,
      'info',
      t(['orderTitle'], { fallback: 'Заявка' }),
      t(['orderFilledLabel'], {
        fallback: `Заявка ${orderId} исполнилась`,
        orderId
      })
    ));
  }

  orderPartiallyFilled(orderId: string, qty: number): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderPartiallyFilled,
      'info',
      t(['orderTitle'], { fallback: 'Заявка' }),
      t(['orderPartiallyFilledLabel'], {
        fallback: `Заявка ${orderId} исполнилась на ${qty} шт.`,
        orderId,
        qty
      })
    ));
  }

  orderStatusChangeToCancelled(orderId: string): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderStatusChangeToCancelled,
      'info',
      t(['orderTitle'], { fallback: 'Заявка' }),
      t(['OrderStatusChangeToCancelledLabel'], {
        fallback: `Заявка ${orderId} была отменена`,
        orderId
      })
    ));
  }

  orderUpdated(orderNumber: string): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderUpdated,
      'success',
      t(['orderUpdatedLabel'], { fallback: 'Заявка изменена' }),
      t(['orderUpdatedContent'], {
        fallback: `Заявка успешно изменена, её номер на бирже: \n ${orderNumber}`,
        orderNumber
      })
    ));
  }

  orderUpdateFailed(result: OrderCommandResult): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderUpdateFailed,
      'error',
      t(['orderUpdateFailedLabel'], { fallback: 'Ошибка изменения заявки' }),
      this.prepareErrorMessage(result.message)
    ));
  }

  orderStatusChanged(orderId: string, orderStatus: string): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderStatusChanged,
      'info',
      t(['orderTitle'], { fallback: 'Заявка' }),
      t(['orderStatusChangedLabel'], {
        fallback: `Статус заявки ${orderId} изменился на ${orderStatus}`,
        orderId,
        orderStatus
      })
    ));
  }

  ordersGroupCreated(orderIds: string): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrdersGroupCreated,
      'success',
      t(['ordersGroupCreatedLabel'], { fallback: `Группа создана` }),
      t(
        ['ordersGroupCreatedContent'],
        {
          fallback: `Группа с заявками ${orderIds} успешно создана`,
          orderIds
        })
    ));
  }

  ordersGroupUnsupported(): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrdersGroupUnsupported,
      'error',
      t(['ordersGroupUnsupportedLabel'], { fallback: `Группы не поддерживаются` }),
      t(
        ['ordersGroupUnsupportedContent'],
        {
          fallback: `Создание группы заявок недоступно`
        })
    ));
  }

  orderCancelled(orderId: string, exchange: string): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderCancelled,
      'success',
      t(['orderCancelledTitle'], { fallback: 'Заявка отменена' }),
      t(['orderCancelledContent'], {
        fallback: `Заявка ${orderId} на ${exchange} успешно отменена`,
        orderId,
        exchange
      })
    ));
  }

  orderCancelFailed(result: OrderCommandResult): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderCancelFailed,
      'error',
      t(['orderCancelFailedLabel'], { fallback: 'Ошибка отмены заявки' }),
      this.prepareErrorMessage(result.message)
    ));
  }

  private prepareErrorMessage(message: string): string {
    const links = new RegExp(httpLinkRegexp, 'im').exec(message);
    if (links == null || !links.length) {
      return message;
    }

    return links!.reduce((result, link) => result.replace(link, `<a href="${link}" target="_blank">${link}</a>`), message);
  }
}
