import { Injectable } from '@angular/core';
import { Order } from '../models/orders/order.model';
import { InstantNotificationsService } from './instant-notifications.service';
import { OrdersInstantNotificationType } from '../models/terminal-settings/terminal-settings.model';
import { TranslatorFn, TranslatorService } from "./translator.service";
import { Observable, shareReplay, take } from "rxjs";
import { HashMap } from "@ngneat/transloco/lib/types";

interface MsgTranslationData {
  path: string[];
  params: HashMap;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersNotificationsService {
  private translator$!: Observable<TranslatorFn>;
  prevNotifications = new Set();

  constructor(
    private readonly notification: InstantNotificationsService,
    private readonly translatorService: TranslatorService
  ) {
  }

  notificateAboutNewOrder(order: Order): void {
    let secondsPassed = (new Date().getTime() - order.transTime.getTime()) / 1000;
    if (order.status == 'filled' && secondsPassed < 5) {
      this.notify(
        {
          path: ['orderFilledLabel'],
          params: {
            fallback: `Заявка ${order.id} исполнилась`,
            orderId: order.id
          }
        },
        OrdersInstantNotificationType.OrderFilled
      );
    }
    if (order.status == 'canceled' && secondsPassed < 5) {
      this.notify(
        {
          path: ['orderCancelledLabel'],
          params: {
            fallback: `Заявка ${order.id} была отменена`,
            orderId: order.id
          }
        },
        OrdersInstantNotificationType.OrderCancelled
      );
    }
  }

  notificateOrderChange(newOrder: Order, oldOrder: Order): void {
    if (newOrder.status != oldOrder.status) {
      this.notify(
        {
          path: ['orderStatusChangedLabel'],
          params: {
            fallback: `Статус заявки ${newOrder.id} изменился на ${newOrder.status}`,
            orderId: newOrder.id,
            orderStatus: newOrder.status
          }
        },
        OrdersInstantNotificationType.OrderStatusChanged
      );
    } else if (newOrder.filledQtyUnits != oldOrder.filledQtyUnits) {
      this.notify(
        {
          path: ['orderPartiallyFilledLabel'],
          params: {
            fallback: `Заявка ${newOrder.id} исполнилась на ${newOrder.filledQtyUnits - oldOrder.filledQtyUnits} шт.`,
            orderId: newOrder.id,
            qty: newOrder.filledQtyUnits - oldOrder.filledQtyUnits
          }
        },
        OrdersInstantNotificationType.OrderPartiallyFilled
      );
    }
  }

  private notify(messageData: MsgTranslationData, notificationType: OrdersInstantNotificationType): void {
    this.getTranslatorFn()
      .pipe(take(1))
      .subscribe(t => {
        const messageString = t(messageData.path, messageData.params);

        if (this.prevNotifications.has(messageString)) {
          return;
        } else {
          this.notification.showNotification(
            notificationType,
            'info',
            t(['orderTitle'], {fallback: 'Заявка'}),
            messageString
          );
          this.prevNotifications.add(messageString);
        }
      });
  }

  private getTranslatorFn(): Observable<TranslatorFn> {
    if (this.translator$ == null) {
      this.translator$ = this.translatorService.getTranslator('shared/orders-notifications')
        .pipe(shareReplay(1));
    }

    return this.translator$;
  }
}
