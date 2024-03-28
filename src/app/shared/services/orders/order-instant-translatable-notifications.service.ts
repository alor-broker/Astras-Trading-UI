import { Injectable } from '@angular/core';
import { InstantNotificationsService } from "../instant-notifications.service";
import { TranslatorFn, TranslatorService } from "../translator.service";
import { BaseTranslatorService } from "../base-translator.service";
import { HttpErrorResponse } from "@angular/common/http";
import { httpLinkRegexp } from "../../utils/regexps";
import {
  OrdersInstantNotificationType
} from "../../models/terminal-settings/terminal-settings.model";

@Injectable({
  providedIn: 'root'
})
export class OrderInstantTranslatableNotificationsService
extends BaseTranslatorService {
  protected translationsPath = 'shared/orders-notifications';

  constructor(
    protected readonly notificationsService: InstantNotificationsService,
    protected readonly translatorService: TranslatorService
  ) {
    super(translatorService);
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

  orderSubmitFailed(err: HttpErrorResponse): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderSubmitFailed,
      'error',
      t(['orderSubmitFailedLabel'], { fallback: 'Ошибка выставления заявки' }),
      this.handleError(err, t)
    ));
  }

  orderFilled(orderId: string): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderFilled,
      'info',
      t(['orderTitle'], {fallback: 'Заявка'}),
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
      t(['orderTitle'], {fallback: 'Заявка'}),
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
      t(['orderTitle'], {fallback: 'Заявка'}),
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

  orderUpdateFailed(error: HttpErrorResponse): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderUpdateFailed,
      'error',
      t(['orderUpdateFailedLabel'], { fallback: 'Ошибка изменения заявки' }),
      this.handleError(error, t)
    ));
  }

  orderStatusChanged(orderId: string, orderStatus: string): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderStatusChanged,
      'info',
      t(['orderTitle'], {fallback: 'Заявка'}),
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

  orderCancelled(orderId: string, exchange: string): void {
    this.withTranslation(t => this.notificationsService.showNotification(
      OrdersInstantNotificationType.OrderCancelled,
      'success',
      t(['orderCancelledTitle'], {fallback: 'Заявка отменена'}),
      t(['orderCancelledContent'], {
        fallback: `Заявка ${orderId} на ${exchange} успешно отменена`,
        orderId,
        exchange
      })
    ));
  }

  private handleError(error: HttpErrorResponse, t: TranslatorFn): string {
    const errorMessage = error.error?.code != null && error.error?.message != null
      ? `${t(['error'])} ${error.error.code} <br/> ${error.error.message}`
      : error.message;

    return this.prepareErrorMessage(errorMessage as string);
  }

  private prepareErrorMessage(message: string): string {
    const links = new RegExp(httpLinkRegexp, 'im').exec(message);
    if (links == null || !links.length) {
      return message;
    }

    return links!.reduce((result, link) => result.replace(link, `<a href="${link}" target="_blank">${link}</a>`), message);
  }
}
