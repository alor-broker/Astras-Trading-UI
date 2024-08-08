import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';
import { Observable, switchMap, combineLatest, map, filter, startWith } from "rxjs";
import { OrdersGroupService } from "../../../../shared/services/orders/orders-group.service";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../models/blotter-settings.model";
import { mapWith } from "../../../../shared/utils/observable-helper";
import {Order, StopOrder} from "../../../../shared/models/orders/order.model";
import { OrdersGroupTreeNode } from "../../../../shared/models/orders/orders-group.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { getConditionSign, getConditionTypeByString } from "../../../../shared/utils/order-conditions-helper";

@Component({
  selector: 'ats-orders-group-modal',
  templateUrl: './orders-group-modal.component.html',
  styleUrls: ['./orders-group-modal.component.less']
})
export class OrdersGroupModalComponent implements AfterViewInit {
  @Input({required: true})
  guid!: string;

  @Input()
  groupId?: string;

  @ViewChildren('ordersGroupTree', {read: ElementRef})
  ordersGroupTree!: QueryList<ElementRef>;

  groups$?: Observable<OrdersGroupTreeNode[]>;

  constructor(
    private readonly service: OrdersGroupService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngAfterViewInit(): void {
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
                groupOrderMinPrice = Math.min(groupOrderMinPrice, (o as StopOrder).triggerPrice || o.price);
                groupOrderMaxPrice = Math.max(groupOrderMaxPrice, (o as StopOrder).triggerPrice || o.price);
                groupOrderMinQty = Math.min(groupOrderMinQty, o.qtyBatch);
                groupOrderMaxQty = Math.max(groupOrderMaxQty, o.qtyBatch);
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
                expanded: this.groupId != null && (group.id === this.groupId),
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

    this.ordersGroupTree.changes.pipe(
      map(q => q.first as ElementRef<HTMLElement> | undefined),
      startWith(this.ordersGroupTree.first),
      filter((el): el is ElementRef<HTMLElement> => !!el),
      takeUntilDestroyed(this.destroyRef)
    )
      .subscribe(tree => {
        tree.nativeElement.querySelectorAll('nz-tree-node-title')
          .forEach(node => {
            node.removeAttribute('title');
          });
      });
  }

  getOrderConditionSign(condition: string): string | null {
    return getConditionSign(getConditionTypeByString(condition)!);
  }
}
