import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  tap,
} from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CurrencyCode,
} from 'src/app/shared/models/enums/currencies.model';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { OrdersNotificationsService } from 'src/app/shared/services/orders-notifications.service';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import { BlotterSettings } from '../models/blotter-settings.model';

@Injectable()
export class BlotterService {

  private shouldShowOrderGroupModal = new BehaviorSubject<boolean>(false);
  private orderGroupParams = new BehaviorSubject<string | null>(null);
  shouldShowOrderGroupModal$ = this.shouldShowOrderGroupModal.asObservable();
  orderGroupParams$ = this.orderGroupParams.asObservable();

  constructor(
    private readonly notification: OrdersNotificationsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService
  ) {
  }

  selectNewInstrument(symbol: string, exchange: string, badgeColor: string) {
    if (symbol == CurrencyCode.RUB) {
      return;
    }
    if (CurrencyCode.isCurrency(symbol)) {
      symbol = CurrencyCode.toInstrument(symbol);
      exchange = Exchanges.MOEX;
    }
    const instrument = { symbol, exchange, instrumentGroup: undefined };
    this.dashboardContextService.selectDashboardInstrument(instrument, badgeColor);
  }

  getPositions(settings: BlotterSettings) {
    return this.portfolioSubscriptionsService.getAllPositionsSubscription(settings.portfolio, settings.exchange).pipe(
      map(poses => settings.isSoldPositionsHidden ? poses.filter(p => p.qtyTFuture !== 0) : poses),
    );
  }

  getTrades(settings: BlotterSettings) {
    return this.portfolioSubscriptionsService.getTradesSubscription(settings.portfolio, settings.exchange);
  }

  getOrders(settings: BlotterSettings) {
    return this.portfolioSubscriptionsService.getOrdersSubscription(settings.portfolio, settings.exchange).pipe(
      tap(x => {
        if (!x.lastOrder) {
          return;
        }

        if (x.existingOrder) {
          this.notification.notificateOrderChange(x.lastOrder, x.existingOrder);
        }
        else {
          this.notification.notificateAboutNewOrder(x.lastOrder);
        }
      }),
      map(x => x.allOrders)
    );
  }

  getStopOrders(settings: BlotterSettings) {
    return this.portfolioSubscriptionsService.getStopOrdersSubscription(settings.portfolio, settings.exchange).pipe(
      tap(x => {
        if (!x.lastOrder) {
          return;
        }

        if (x.existingOrder) {
          this.notification.notificateOrderChange(x.lastOrder, x.existingOrder);
        }
        else {
          this.notification.notificateAboutNewOrder(x.lastOrder);
        }
      }),
      map(x => x.allOrders)
    );
  }

  openOrderGroupModal(groupId: string) {
    this.orderGroupParams.next(groupId);
    this.shouldShowOrderGroupModal.next(true);
  }

  closeOrderGroupModal() {
    this.orderGroupParams.next(null);
    this.shouldShowOrderGroupModal.next(false);
  }
}
