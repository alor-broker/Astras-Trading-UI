import { Injectable } from '@angular/core';
import { Order } from '../models/orders/order.model';
import { OrdersInstantNotificationType } from '../models/terminal-settings/terminal-settings.model';
import { InstantTranslatableNotificationsService } from "./instant-translatable-notifications.service";

@Injectable({
  providedIn: 'root'
})
export class OrdersNotificationsService {
  prevNotifications = new Set();

  constructor(
    private readonly notification: InstantTranslatableNotificationsService
  ) {
  }

  notificateAboutNewOrder(order: Order): void {
    let secondsPassed = (new Date().getTime() - order.transTime.getTime()) / 1000;
    if (order.status == 'filled' && secondsPassed < 5) {
      this.notify(
        OrdersInstantNotificationType.OrderFilled,
        { orderId: order.id }
      );
    }
    if (order.status == 'canceled' && secondsPassed < 5) {
      this.notify(
        OrdersInstantNotificationType.OrderCancelled,
        { orderId: order.id, exchange: order.exchange }
      );
    }
  }

  notificateOrderChange(newOrder: Order, oldOrder: Order): void {
    if (newOrder.status != oldOrder.status) {
      this.notify(
        OrdersInstantNotificationType.OrderStatusChanged,
        { orderId: newOrder.id, orderStatus: newOrder.status }
      );
    } else if (newOrder.filledQtyUnits != oldOrder.filledQtyUnits) {
      this.notify(
        OrdersInstantNotificationType.OrderPartiallyFilled,
        { orderId: newOrder.id, qty: newOrder.filledQtyUnits - oldOrder.filledQtyUnits}
      );
    }
  }

  private notify(notificationType: OrdersInstantNotificationType, variables: { [varName: string]: unknown }): void {
    const notificationKey = `${notificationType}_${JSON.stringify(variables)}`;

    if (this.prevNotifications.has(notificationKey)) {
      return;
    } else {
      this.notification.showNotification(notificationType, variables);
      this.prevNotifications.add(notificationKey);
    }
  }
}
