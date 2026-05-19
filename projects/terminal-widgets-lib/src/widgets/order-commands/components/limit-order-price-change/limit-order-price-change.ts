import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  Observable,
  shareReplay,
  take,
  withLatestFrom
} from "rxjs";
import {
  filter,
  map,
  startWith
} from "rxjs/operators";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  AsyncPipe,
  NgTemplateOutlet
} from '@angular/common';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {toObservable} from "@angular/core/rxjs-interop";
import {Side} from '@terminal-core-lib/common/types/side.types';
import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {MarginOrderConfirmationService} from '@terminal-core-lib/features/orders/services/margin-order-notification.service';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {OrderType} from '@terminal-core-lib/features/orders/types/orders.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {Order} from '@terminal-core-lib/features/portfolios/types/order.types';

@Component({
  selector: 'ats-limit-order-price-change',
  templateUrl: './limit-order-price-change.html',
  styleUrls: ['./limit-order-price-change.less'],
  imports: [
    TranslocoDirective,
    NgTemplateOutlet,
    NzTooltipDirective,
    NzButtonComponent,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LimitOrderPriceChange implements OnInit {
  readonly orderSides = Side;

  activeLimitOrders$!: Observable<Order[]>;

  readonly steps = input.required<number[]>();

  readonly instrument = input.required<Instrument>();

  readonly currentPortfolio = input.required<PortfolioKey>();

  readonly skipMarginOrderConfirmation = input(false);

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

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  private readonly marginOrderConfirmationService = inject(MarginOrderConfirmationService);

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
    if (this.skipMarginOrderConfirmation()) {
      this.updateOrdersPrice(step, side, null);
    } else {
      const currentPortfolio = this.currentPortfolio();
      this.marginOrderConfirmationService.checkWithConfirmation({
        portfolio: currentPortfolio.portfolio,
        exchange: currentPortfolio.exchange
      }).pipe(
        take(1)
      ).subscribe(isConfirmed => this.updateOrdersPrice(step, side, isConfirmed));
    }
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

  private updateOrdersPrice(step: number, side: Side, marginOrderConfirmed: boolean | null): void {
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
            side: order.side,
            allowMargin: marginOrderConfirmed ?? undefined
          },
          selection.portfolioKey.portfolio,
        ).subscribe();
      });
    });
  }
}
