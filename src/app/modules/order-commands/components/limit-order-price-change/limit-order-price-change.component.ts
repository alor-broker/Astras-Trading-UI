import { Component, input, OnInit, inject } from '@angular/core';
import {combineLatest, Observable, shareReplay, take, withLatestFrom} from "rxjs";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {Order, OrderType} from "../../../../shared/models/orders/order.model";
import {Side} from "../../../../shared/models/enums/side.model";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {filter, map, startWith} from "rxjs/operators";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../../shared/services/orders/order-command.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {toObservable} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-limit-order-price-change',
  templateUrl: './limit-order-price-change.component.html',
  styleUrls: ['./limit-order-price-change.component.less'],
  imports: [
    TranslocoDirective,
    NgTemplateOutlet,
    NzTooltipDirective,
    NzButtonComponent,
    AsyncPipe
  ]
})
export class LimitOrderPriceChangeComponent implements OnInit {
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);
  private readonly orderCommandService = inject<OrderCommandService>(ORDER_COMMAND_SERVICE_TOKEN);

  readonly orderSides = Side;
  activeLimitOrders$!: Observable<Order[]>;
  readonly steps = input.required<number[]>();
  readonly instrument = input.required<Instrument>();
  readonly currentPortfolio = input.required<PortfolioKey>();
  protected readonly instrumentChanges$ = toObservable(this.instrument)
    .pipe(
      startWith(null),
      shareReplay(1)
    );

  protected readonly currentPortfolioChanges$ = toObservable(this.currentPortfolio)
    .pipe(
      startWith(null),
      shareReplay(1)
    );

  get sortedSteps(): number[] {
    return [...this.steps()].sort((a, b) => a - b);
  }

  ngOnInit(): void {
    this.activeLimitOrders$ = this.getInstrumentWithPortfolio().pipe(
      mapWith(
        x => this.portfolioSubscriptionsService.getOrdersSubscription(x.portfolioKey!.portfolio, x.portfolioKey!.exchange),
        (source, orders) => ({instrument: source.instrument!, orders})
      ),
      map(s => s.orders.allOrders.filter(o => o.targetInstrument.symbol === s.instrument.symbol && o.type === OrderType.Limit && o.status === 'working')),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  hasOrdersWithSide(orders: Order[], side: Side): boolean {
    return !!orders.find(o => o.side === side);
  }

  updateLimitOrdersPrice(step: number, side: Side): void {
    this.activeLimitOrders$.pipe(
      withLatestFrom(this.getInstrumentWithPortfolio()),
      take(1)
    ).subscribe(([orders, selection]) => {
      const ordersToUpdate = orders.filter(o => o.side === side);
      if (ordersToUpdate.length === 0) {
        return;
      }

      ordersToUpdate.forEach(order => {
        const precision = MathHelper.getPrecision(selection.instrument.minstep);

        const newPrice = MathHelper.round(order.price + step * selection.instrument.minstep, precision);
        this.orderCommandService.submitLimitOrderEdit(
          {
            orderId: order.id,
            quantity: order.qtyBatch - (order.filledQtyBatch ?? 0),
            price: newPrice,
            instrument: order.targetInstrument,
            side: order.side
          },
          selection.portfolioKey.portfolio
        ).subscribe();
      });
    });
  }

  protected getInstrumentWithPortfolio(): Observable<{ instrument: Instrument, portfolioKey: PortfolioKey }> {
    return combineLatest({
      instrument: this.instrumentChanges$,
      portfolioKey: this.currentPortfolioChanges$
    }).pipe(
      filter(x => !!x.instrument && !!x.portfolioKey),
      map(x => ({instrument: x.instrument!, portfolioKey: x.portfolioKey!}))
    );
  }
}
