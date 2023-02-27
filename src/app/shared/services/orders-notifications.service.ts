import { Injectable } from '@angular/core';
import { Order } from '../models/orders/order.model';
import { InstantNotificationsService } from './instant-notifications.service';
import { OrdersInstantNotificationType } from '../models/terminal-settings/terminal-settings.model';

@Injectable({
  providedIn: 'root'
})
export class OrdersNotificationsService {
  prevNotifications = new Set();

  constructor(private notification: InstantNotificationsService) {
  }

  notificateAboutNewOrder(order: Order) {
    let seccondsPassed = (new Date().getTime() - order.transTime.getTime()) / 1000;
    if (order.status == 'filled' && seccondsPassed < 5) {
      this.notify(`Заявка ${order.id} исполнилась`, OrdersInstantNotificationType.OrderFilled);
    }
    if (order.status == 'canceled' && seccondsPassed < 5) {
      this.notify(`Заявка ${order.id} была отменена`, OrdersInstantNotificationType.OrderCancelled);
    }
  }

  notificateOrderChange(newOrder: Order, oldOrder: Order) {
    if (newOrder.status != oldOrder.status) {
      this.notify(`Статус заявки ${newOrder.id} изменился на ${newOrder.status}`, OrdersInstantNotificationType.OrderStatusChanged);
    }
    else if (newOrder.filledQtyUnits != oldOrder.filledQtyUnits) {
      this.notify(`Заявка ${newOrder.id} исполнилась на ${newOrder.filledQtyUnits - oldOrder.filledQtyUnits} шт.`, OrdersInstantNotificationType.OrderPartiallyFilled);
    }
  }

  private notify(message: string, notificationType: OrdersInstantNotificationType) {
    if (this.prevNotifications.has(message)) {
      return;
    }
    else {
      this.notification.showNotification(notificationType, 'info', 'Заявка', message);
      this.prevNotifications.add(message);
    }
  }
}
