import { Component, Input, OnInit } from '@angular/core';
import { Observable, switchMap, combineLatest, map } from "rxjs";
import { OrdersGroupService } from "../../../../shared/services/orders/orders-group.service";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../models/blotter-settings.model";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { Order } from "../../../../shared/models/orders/order.model";

@Component({
  selector: 'ats-orders-group-modal',
  templateUrl: './orders-group-modal.component.html',
  styleUrls: ['./orders-group-modal.component.less']
})
export class OrdersGroupModalComponent implements OnInit {
  @Input() groupId!: string;
  @Input() guid!: string;

  groups$?: Observable<any>;

  constructor(
    private readonly service: OrdersGroupService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly widgetSettingsService: WidgetSettingsService
  ) {
  }

  ngOnInit() {
    const allOrders$ = this.widgetSettingsService.getSettings<BlotterSettings>(this.guid)
      .pipe(
        switchMap((s) => combineLatest([
          this.portfolioSubscriptionsService.getOrdersSubscription(s.portfolio, s.exchange),
          this.portfolioSubscriptionsService.getStopOrdersSubscription(s.portfolio, s.exchange)
        ])),
        map(([orders, stopOrders]) => ([...orders.allOrders, ...stopOrders.allOrders]))
      );

    this.groups$ = this.service.getAllOrderGroups()
      .pipe(
        mapWith(
          () => allOrders$,
          (groups, orders: Order[]) => ({groups, orders})
        ),
        map(({groups, orders}) => {
          return groups
            .filter(g => !!g.orders.length)
            .map(group => {
              const limitOrderId = group.orders.find(o => o.type === 'Limit')?.orderId;
              const mainOrder = orders.find(o => limitOrderId && o.id === limitOrderId);

              if (!mainOrder) {
                return null;
              }

              return {
                order: mainOrder,
                key: mainOrder.id,
                expanded: group.id === this.groupId,
                selectable: false,
                status: group.status,
                children: group.orders
                  .filter(o => o.type !== 'Limit')
                  .map(go => orders.find(o => go.orderId === o.id))
                  .map(o => (o ? {
                      order: o,
                      selectable: false,
                      key: o.id,
                      isLeaf: true
                    } : null
                  ))
                  .filter(o => !!o)
              };
            })
            .filter(g => !!g);
        })
      );
  }
}
