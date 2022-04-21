import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Order } from '../models/orders/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrdersNotificationsService {
  prevNotifications = new Set();

  constructor(private notification: NzNotificationService) { }

  notificateAboutNewOrder(order: Order) {
    let seccondsPassed = (new Date().getTime() - order.transTime.getTime()) / 1000;
    if (order.status == 'filled' && seccondsPassed  < 5) {
      this.notificate(`Заявка ${order.id} исполнилась`);
    }
  }

  notificateOrderChange(newOrder: Order, oldOrder: Order) {
    if (newOrder.status != oldOrder.status) {
      this.notificate(`Статус заявки ${newOrder.id} изменился на ${newOrder.status}`);
    }
    else if (newOrder.filledQtyUnits != oldOrder.filledQtyUnits) {
      this.notificate(`Заявка ${newOrder.id} исполнилась на ${newOrder.filledQtyUnits - oldOrder.filledQtyUnits} шт.`);
    }
  }

  private notificate(message: string) {
    if (this.prevNotifications.has(message)) {
      return;
    }
    else {
      this.notification.info('Заявка', message);
      this.prevNotifications.add(message);
    }
  }
}
