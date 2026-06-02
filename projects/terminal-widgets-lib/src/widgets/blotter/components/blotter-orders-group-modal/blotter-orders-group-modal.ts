import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  viewChildren,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  filter,
  map,
  Observable,
  switchMap
} from "rxjs";
import {
  takeUntilDestroyed,
  toObservable
} from "@angular/core/rxjs-interop";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzTreeComponent,
  NzTreeNodeOptions
} from 'ng-zorro-antd/tree';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {AsyncPipe} from '@angular/common';
import {OrdersGroupService} from '@terminal-core-lib/features/orders/services/order-group.service';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {
  Order,
  StopOrder
} from '@terminal-core-lib/features/portfolios/types/order.types';
import {ConditionHelper} from '@terminal-core-lib/common/utils/condition.helper';
import {
  NzModalComponent,
  NzModalContentDirective,
  NzModalFooterDirective
} from 'ng-zorro-antd/modal';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';

export interface OrdersGroupTreeNode extends NzTreeNodeOptions {
  order?: Order | StopOrder;
  group?: {
    id: string;
    displayId: string;
    instruments: string;
    prices: string;
    qtys: string;
  };
  status?: 'Active' | 'Canceled' | 'Filled';
  children?: OrdersGroupTreeNode[];
}

@Component({
  selector: 'ats-blotter-orders-group-modal',
  templateUrl: './blotter-orders-group-modal.html',
  styleUrls: ['./blotter-orders-group-modal.less'],
  imports: [
    TranslocoDirective,
    NzTreeComponent,
    NzTooltipDirective,
    AsyncPipe,
    NzModalComponent,
    NzModalContentDirective,
    NzModalFooterDirective,
    NzButtonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BlotterOrdersGroupModal implements AfterViewInit {
  readonly portfolioKey = input.required<PortfolioKey>();

  readonly groupId = model<string | null>(null);

  readonly ordersGroupTree = viewChildren<ElementRef<HTMLElement>>('ordersGroupTree');

  groups$?: Observable<OrdersGroupTreeNode[]>;

  private readonly service = inject(OrdersGroupService);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly ordersGroupTreeChanges$ = toObservable(this.ordersGroupTree);

  private readonly portfolioKeyChanges$ = toObservable(this.portfolioKey);

  private readonly groupIdChanges$ = toObservable(this.groupId);

  ngAfterViewInit(): void {
    const allOrders$ = this.portfolioKeyChanges$
      .pipe(
        switchMap((s) => combineLatest([
          this.portfolioSubscriptionsService.getOrdersSubscription(s.portfolio, s.exchange),
          this.portfolioSubscriptionsService.getStopOrdersSubscription(s.portfolio, s.exchange)
        ])),
        map(([orders, stopOrders]) => ([...orders.allOrders, ...stopOrders.allOrders]))
      );

    this.groups$ = combineLatest({
      groups: this.service.getAllOrderGroups(),
      orders: allOrders$,
      targetGroupId: this.groupIdChanges$

    }).pipe(
      map(({groups, orders, targetGroupId}) => {
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
                instruments: Array.from(new Set(groupOrders.map(o => o.targetInstrument.symbol))).join('/'),
                prices: groupOrderMaxPrice === groupOrderMinPrice
                  ? groupOrderMinPrice
                  : `${groupOrderMinPrice}-${groupOrderMaxPrice}`,
                qtys: groupOrderMaxQty === groupOrderMinQty
                  ? groupOrderMinQty
                  : `${groupOrderMinQty}-${groupOrderMaxQty}`,

              },
              key: group.id,
              expanded: targetGroupId != null && (group.id === targetGroupId),
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

    this.ordersGroupTreeChanges$.pipe(
      map(x => x.length > 0 ? x[0] : undefined),
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
    return ConditionHelper.getConditionSign(ConditionHelper.getConditionTypeByString(condition)!);
  }
}
