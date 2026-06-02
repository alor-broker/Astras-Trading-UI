import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output
} from '@angular/core';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {
  CurrentOrder,
  OrderBook
} from '@terminal-widgets-lib/widgets/orderbook/types/orderbook.types';
import {ThemeSettings} from '@terminal-core-lib/features/themes/themes.types';
import {OrdersDialogService} from "@terminal-core-lib/features/orders/services/orders-dialog.service";
import {ThemeService} from "@terminal-core-lib/features/themes/services/theme.service";
import {Side} from "@terminal-core-lib/common/types/side.types";
import {OrderType} from '@terminal-core-lib/features/orders/types/orders.types';
import {OrderFormType} from '@terminal-core-lib/features/orders/services/orders-dialog-service.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {OrderbookService} from '@terminal-widgets-lib/widgets/orderbook/services/orderbook.service';

@Component({
  template: ''
})
export abstract class OrderbookTableBase implements OnInit {
  readonly numberFormats = NumberDisplayFormat;

  readonly ob = input<OrderBook | null>(null);

  readonly volumeDisplayFormat = input<NumberDisplayFormat>(NumberDisplayFormat.Default);

  readonly showYield = input<boolean>(false);

  readonly priceDisplayFormat = input<{
    showPriceWithZeroPadding: boolean;
    priceStep?: number;
  }>({
    showPriceWithZeroPadding: false,
    priceStep: 1,
  });

  readonly rowSelected = output<{ price: number, side: Side }>();

  protected readonly Side = Side;

  protected readonly ordersDialogService = inject(OrdersDialogService);

  protected readonly orderbookService = inject(OrderbookService);

  protected readonly themeService = inject(ThemeService);

  protected readonly destroyRef = inject(DestroyRef);

  private themeSettings?: ThemeSettings;

  ngOnInit(): void {
    this.themeService.getThemeSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(s => this.themeSettings = s);
  }

  newLimitOrder(event: MouseEvent, price: number, side: Side): void {
    event.stopPropagation();
    this.rowSelected.emit({price, side});
  }

  updateOrderPrice(order: CurrentOrder, price: number): void {
    if (order.type !== OrderType.Limit && order.type !== OrderType.StopMarket && order.type !== OrderType.StopLimit) {
      return;
    }

    this.ordersDialogService.openEditOrderDialog({
      instrumentKey: order.targetInstrument,
      portfolioKey: order.ownedPortfolio,
      orderId: order.orderId,
      orderType: order.type === OrderType.Limit ? OrderFormType.Limit : OrderFormType.Stop,
      initialValues: {
        quantity: order.volume,
        price,
        hasPriceChanged: true
      }
    });
  }

  cancelOrder(event: MouseEvent, orders: CurrentOrder[]): void {
    event.stopPropagation();
    for (const order of orders) {
      this.orderbookService.cancelOrder(order);
    }
  }

  getBidStyle(value: number): Record<string, string> | null {
    const ob = this.ob();
    if (!this.themeSettings || !ob) {
      return null;
    }

    const size = 100 * (value / ob.maxVolume);
    return {
      background: `linear-gradient(270deg, ${this.themeSettings.themeColors.buyColorBackground} ${size}% , rgba(0,0,0,0) ${size}%)`,
    };
  }

  getAskStyle(value: number): Record<string, string> | null {
    const ob = this.ob();
    if (!this.themeSettings || !ob) {
      return null;
    }

    const size = 100 * (value / ob.maxVolume);
    return {
      background: `linear-gradient(90deg, ${this.themeSettings.themeColors.sellColorBackground} ${size}%, rgba(0,0,0,0) ${size}%)`,
    };
  }

  getPriceDecimalSymbolsCount(): number | null {
    const priceDisplayFormat = this.priceDisplayFormat();
    return priceDisplayFormat.showPriceWithZeroPadding
      ? MathHelper.getPrecision(priceDisplayFormat.priceStep ?? 1)
      : null;
  }
}
