import { Injectable, inject } from '@angular/core';
import { Order } from '../models/orders/order.model';
import { OrdersInstantNotificationType } from '../models/terminal-settings/terminal-settings.model';
import {
  OrderInstantTranslatableNotificationsService
} from "./orders/order-instant-translatable-notifications.service";

@Injectable({
  providedIn: 'root'
})
export class OrdersNotificationsService {
  private readonly notification = inject(OrderInstantTranslatableNotificationsService);

  prevNotifications = new Set();

  notificateAboutNewOrder(order: Order): void {
    const secondsPassed = (new Date().getTime() - order.transTime.getTime()) / 1000;
    if (order.status == 'filled' && secondsPassed < 5) {
      this.notify(
        `${OrdersInstantNotificationType.OrderFilled}_${order.id}`,
        () => this.notification.orderFilled(order.id),
      );
    }
    if (order.status == 'canceled' && secondsPassed < 5) {
      this.notify(
        `${OrdersInstantNotificationType.OrderStatusChangeToCancelled}_${order.id}`,
        () => this.notification.orderStatusChangeToCancelled(order.id)
      );
    }
  }

  notificateOrderChange(newOrder: Order, oldOrder: Order): void {
    if (newOrder.status != oldOrder.status) {
      this.notify(
        `${OrdersInstantNotificationType.OrderStatusChanged}_${newOrder.id}_${newOrder.status}`,
        () => this.notification.orderStatusChanged(newOrder.id, newOrder.status)
      );
    } else if (newOrder.filledQtyUnits != oldOrder.filledQtyUnits) {
      this.notify(
        `${OrdersInstantNotificationType.OrderPartiallyFilled}_${newOrder.id}_${newOrder.filledQtyUnits - oldOrder.filledQtyUnits}`,
        () => this.notification.orderPartiallyFilled(newOrder.id, newOrder.filledQtyUnits - oldOrder.filledQtyUnits)
      );
    }
  }

  private notify(notificationKey: string, notifyFn: () => void): void {
    if (this.prevNotifications.has(notificationKey)) {
      return;
    } else {
      notifyFn();
      this.prevNotifications.add(notificationKey);
    }
  }
}
