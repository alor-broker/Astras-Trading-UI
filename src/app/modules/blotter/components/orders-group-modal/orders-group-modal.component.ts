import { Component, Input, OnInit } from '@angular/core';
import { Observable, switchMap, combineLatest, map } from "rxjs";
import { OrdersGroupService } from "../../../../shared/services/orders/orders-group.service";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../models/blotter-settings.model";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { Order } from "../../../../shared/models/orders/order.model";
import { OrdersGroupTreeNode } from "../../../../shared/models/orders/orders-group.model";
import { StopOrder } from "../../../../shared/models/orders/stop-order.model";


@Component({
  selector: 'ats-orders-group-modal[guid]',
  templateUrl: './orders-group-modal.component.html',
  styleUrls: ['./orders-group-modal.component.less']
})
export class OrdersGroupModalComponent implements OnInit {
  @Input() guid!: string;
  @Input() groupId?: string;

  groups$?: Observable<OrdersGroupTreeNode[]>;

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
          (groups, orders: (Order | StopOrder)[]) => ({groups, orders})
        ),
        map(({groups, orders}) => {
          return groups
            .filter(g => !!g.orders.length)
            .map(group => {
              const groupOrders: (Order | StopOrder)[] = group.orders
                .map(go => orders.find(o => go.orderId === o.id))
                .filter((o): o is (Order | StopOrder) => !!o);

              if (!groupOrders.length) {
                return null;
              }

              let groupOrderMinPrice = (groupOrders[0] as StopOrder).triggerPrice || groupOrders[0].price;
              let groupOrderMaxPrice = (groupOrders[0] as StopOrder).triggerPrice || groupOrders[0].price;
              let groupOrderMinQty = groupOrders[0].qtyBatch;
              let groupOrderMaxQty = groupOrders[0].qtyBatch;

              groupOrders.forEach(o => {
                if (groupOrderMinPrice > ((o as StopOrder).triggerPrice || o.price)) {
                  groupOrderMinPrice = (o as StopOrder).triggerPrice || o.price;
                }
                if (groupOrderMaxPrice < ((o as StopOrder).triggerPrice || o.price)) {
                  groupOrderMaxPrice = (o as StopOrder).triggerPrice || o.price;
                }
                if (groupOrderMinQty > o.qtyBatch) {
                  groupOrderMinQty = o.qtyBatch;
                }
                if (groupOrderMaxQty < o.qtyBatch) {
                  groupOrderMinPrice = o.qtyBatch;
                }
              });

              return {
                title: '',
                group: {
                  id: group.id,
                  displayId: group.id.slice(-10),
                  instruments: Array.from(new Set(groupOrders.map(o => o.symbol))).join('/'),
                  prices: groupOrderMaxPrice === groupOrderMinPrice
                    ? groupOrderMinPrice
                    : `${groupOrderMinPrice}-${groupOrderMaxPrice}`,
                  qtys: groupOrderMaxQty === groupOrderMinQty
                    ? groupOrderMinQty
                    : `${groupOrderMinQty}-${groupOrderMaxQty}`,

                },
                key: group.id,
                expanded: !!(this.groupId && (group.id === this.groupId)),
                selectable: false,
                status: group.status,
                children: groupOrders
                  .map(o => ({
                      title: '',
                      order: o,
                      selectable: false,
                      key: o.id,
                      isLeaf: true
                    }
                  ))
              } as OrdersGroupTreeNode;
            })
            .filter((g): g is OrdersGroupTreeNode => !!g);
        })
      );
  }
}
