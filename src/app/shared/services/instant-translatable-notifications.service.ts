import { Injectable } from '@angular/core';
import { InstantNotificationsService } from "./instant-notifications.service";
import {
  InstantNotificationType,
  OrdersInstantNotificationType,
  ScalperOrderBookInstantNotificationType,
  SessionInstantNotificationType
} from "../models/terminal-settings/terminal-settings.model";
import { Observable, shareReplay, take } from "rxjs";
import { TranslatorFn, TranslatorService } from "./translator.service";
import { httpLinkRegexp } from "../utils/regexps";
import { HttpErrorResponse } from "@angular/common/http";
import { NzNotificationDataOptions, NzNotificationRef } from "ng-zorro-antd/notification/typings";

interface NotificationData {
  displayType: 'success' | 'info' | 'error' | 'warning';
  title: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class InstantTranslatableNotificationsService {
  private translator$?: Observable<TranslatorFn>;

  constructor(
    private readonly notificationsService: InstantNotificationsService,
    private readonly translatorService: TranslatorService
  ) { }

  showNotification(
    notificationType: InstantNotificationType,
    variables?: any,
    notificationParams?: NzNotificationDataOptions,
    notificationCallback?: (n: NzNotificationRef) => void
  ): void {
    this.getTranslatorFn()
      .pipe(take(1))
      .subscribe(t => {
        const notificationData: NotificationData = {
          displayType: 'info',
          title: '',
          content: ''
        };

        switch (notificationType) {
          case OrdersInstantNotificationType.OrderCreated:
            notificationData.displayType = 'success';
            notificationData.title = t(['orderCreatedLabel'], { fallback: 'Заявка выставлена' });
            notificationData.content = t(['orderCreatedContent'], {
              fallback: `Заявка успешно выставлена, её номер на бирже: \n ${variables.orderNumber}`,
              ...variables
            });
            break;
          case OrdersInstantNotificationType.OrderSubmitFailed:
            notificationData.displayType = 'error';
            notificationData.title = t(['orderSubmitFailedLabel'], { fallback: 'Ошибка выставления заявки' });
            notificationData.content = this.handleError(variables as HttpErrorResponse, t);
            break;
          case OrdersInstantNotificationType.OrderFilled:
            notificationData.displayType = 'info';
            notificationData.title = t(['orderTitle'], {fallback: 'Заявка'});
            notificationData.content = t(['orderFilledLabel'], {
              fallback: `Заявка ${variables.orderId} исполнилась`,
              ...variables
            });
            break;
          case OrdersInstantNotificationType.OrderPartiallyFilled:
            notificationData.displayType = 'info';
            notificationData.title = t(['orderTitle'], {fallback: 'Заявка'});
            notificationData.content = t(['orderPartiallyFilledLabel'], {
              fallback: `Заявка ${variables.orderId} исполнилась на ${variables.qty} шт.`,
              ...variables
            });
            break;
          case OrdersInstantNotificationType.OrderStatusChangeToCancelled:
            notificationData.displayType = 'info';
            notificationData.title = t(['orderTitle'], {fallback: 'Заявка'});
            notificationData.content = t(['OrderStatusChangeToCancelledLabel'], {
              fallback: `Заявка ${variables.orderId} была отменена`,
              ...variables
            });
            break;
          case OrdersInstantNotificationType.OrderUpdated:
            notificationData.displayType = 'success';
            notificationData.title = t(['orderUpdatedLabel'], { fallback: 'Заявка изменена' });
            notificationData.content = t(['orderUpdatedContent'], {
              fallback: `Заявка успешно изменена, её номер на бирже: \n ${variables.orderNumber}`,
              ...variables
            });
            break;
          case OrdersInstantNotificationType.OrderUpdateFailed:
            notificationData.displayType = 'error';
            notificationData.title = t(['orderUpdateFailedLabel'], { fallback: 'Ошибка изменения заявки' });
            notificationData.content = this.handleError(variables as HttpErrorResponse, t);
            break;
          case OrdersInstantNotificationType.OrderStatusChanged:
            notificationData.displayType = 'info';
            notificationData.title = t(['orderTitle'], {fallback: 'Заявка'});
            notificationData.content = t(['orderStatusChangedLabel'], {
              fallback: `Статус заявки ${variables.orderId} изменился на ${variables.orderStatus}`,
              ...variables
            });
            break;
          case OrdersInstantNotificationType.OrdersGroupCreated:
            notificationData.displayType = 'success';
            notificationData.title = t(['ordersGroupCreatedLabel'], { fallback: `Группа создана` });
            notificationData.content = t(
              ['ordersGroupCreatedContent'],
              {
                fallback: `Группа с заявками ${variables.orderIds} успешно создана`,
                ...variables
              });
            break;
          case OrdersInstantNotificationType.OrderCancelled:
            notificationData.displayType = 'success';
            notificationData.title = t(['orderCancelledTitle'], {fallback: 'Заявка отменена'});
            notificationData.content = t(['orderCancelledContent'], {
              fallback: `Заявка ${variables.orderId} на ${variables.exchange} успешно отменена`,
              ...variables
            });
            break;
          case SessionInstantNotificationType.EndOfSession:
            notificationData.displayType = 'warning';
            notificationData.title = t(['sessionWarningMessageTitle'], { fallback: 'Завершение сеанса' });
            notificationData.content = t(['sessionWarningMessageContent'], { fallback: 'Текущий сеанс будет завершен из-за бездействия пользователя' });
            break;
          case ScalperOrderBookInstantNotificationType.EmptyPositions:
            notificationData.displayType = 'error';
            notificationData.title = t(['scalperOrderBookEmptyPositionsErrorTitle'], { fallback: 'Нет позиций' });
            notificationData.content = t(['scalperOrderBookEmptyPositionsErrorContent'], { fallback: 'Позиции для установки стоп-лосс отсутствуют'});
            break;
          default:
            return;
        }

        this.notificationsService.showNotification(
          notificationType,
          notificationData.displayType,
          notificationData.title,
          notificationData.content,
          notificationParams,
          notificationCallback
        );
      });
  }

  private getTranslatorFn(): Observable<TranslatorFn> {
    if (this.translator$ == null) {
      this.translator$ = this.translatorService.getTranslator('shared/translatable-notifications')
        .pipe(shareReplay(1));
    }

    return this.translator$;
  }

  handleError(error: HttpErrorResponse, t: TranslatorFn): string {
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
