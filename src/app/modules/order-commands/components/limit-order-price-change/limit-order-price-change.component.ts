import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, shareReplay, take, withLatestFrom} from "rxjs";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {
  Order,
  OrderType
} from "../../../../shared/models/orders/order.model";
import {Side} from "../../../../shared/models/enums/side.model";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {filter, map} from "rxjs/operators";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import { WsOrdersService } from "../../../../shared/services/orders/ws-orders.service";

@Component({
  selector: 'ats-limit-order-price-change',
  templateUrl: './limit-order-price-change.component.html',
  styleUrls: ['./limit-order-price-change.component.less']
})
export class LimitOrderPriceChangeComponent implements OnInit, OnDestroy {
  readonly orderSides = Side;
  activeLimitOrders$!: Observable<Order[]>;
  @Input({required: true})
  steps: number[] = [];
  private readonly instrument$ = new BehaviorSubject<Instrument | null>(null);
  private readonly portfolioKey$ = new BehaviorSubject<PortfolioKey | null>(null);

  constructor(
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly wsOrdersService: WsOrdersService,
  ) {
  }

  @Input({required: true})
  set portfolioKey(value: PortfolioKey) {
    this.portfolioKey$.next(value);
  }

  @Input({required: true})
  set instrument(value: Instrument) {
    this.instrument$.next(value);
  }

  get sortedSteps(): number[] {
    return [...this.steps].sort((a, b) => a - b);
  }

  ngOnInit(): void {
    this.activeLimitOrders$ = this.getInstrumentWithPortfolio().pipe(
      mapWith(
        x => this.portfolioSubscriptionsService.getOrdersSubscription(x.portfolioKey!.portfolio, x.instrument!.exchange),
        (source, orders) => ({instrument: source.instrument!, orders})
      ),
      map(s => s.orders.allOrders.filter(o => o.symbol === s.instrument.symbol && o.type === OrderType.Limit && o.status === 'working')),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  ngOnDestroy(): void {
    this.instrument$.complete();
    this.portfolioKey$.complete();
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
        this.wsOrdersService.submitLimitOrderEdit(
          {
            orderId: order.id,
            quantity: order.qtyBatch - (order.filledQtyBatch ?? 0),
            price: newPrice,
            instrument: {
              symbol: order.symbol,
              exchange: order.exchange
            },
            side: order.side
          },
          selection.portfolioKey.portfolio
        ).subscribe();
      });
    });
  }

  protected getInstrumentWithPortfolio(): Observable<{ instrument: Instrument, portfolioKey: PortfolioKey }> {
    return combineLatest({
      instrument: this.instrument$,
      portfolioKey: this.portfolioKey$
    }).pipe(
      filter(x => !!x.instrument && !!x.portfolioKey),
      map(x => ({instrument: x.instrument!, portfolioKey: x.portfolioKey!}))
    );
  }
}
