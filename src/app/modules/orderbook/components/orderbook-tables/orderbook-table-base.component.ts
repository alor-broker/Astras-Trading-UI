import {Component, DestroyRef, input, OnInit, output} from '@angular/core';
import {OrderBook} from "../../models/orderbook.model";
import {CurrentOrder} from "../../models/orderbook-view-row.model";
import {OrderbookService} from "../../services/orderbook.service";
import {NumberDisplayFormat} from '../../../../shared/models/enums/number-display-format';
import {ThemeService} from '../../../../shared/services/theme.service';
import {ThemeSettings} from '../../../../shared/models/settings/theme-settings.model';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {OrderFormType} from "../../../../shared/models/orders/orders-dialog.model";
import {OrderType} from "../../../../shared/models/orders/order.model";
import { Side } from "../../../../shared/models/enums/side.model";

@Component({
  template: ''
})
export abstract class OrderbookTableBaseComponent implements OnInit {
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

  readonly rowSelected = output<{price: number, side: Side}>();

  protected readonly Side = Side;

  private themeSettings?: ThemeSettings;

  constructor(
    private readonly ordersDialogService: OrdersDialogService,
    private readonly service: OrderbookService,
    private readonly themeService: ThemeService,
    private readonly destroyRef: DestroyRef
  ) {
  }

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
      this.service.cancelOrder(order);
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
