import { Component, Input } from '@angular/core';
import { OrderBook } from "../../models/orderbook.model";
import { OrderbookSettings } from "../../models/orderbook-settings.model";
import { take } from "rxjs";
import { SelectedPriceData } from "../../../../shared/models/orders/selected-order-price.model";
import { CommandParams } from "../../../../shared/models/commands/command-params.model";
import { CommandType } from "../../../../shared/models/enums/command-type.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetsDataProviderService } from "../../../../shared/services/widgets-data-provider.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { CurrentOrder } from "../../models/orderbook-view-row.model";
import { OrderbookService } from "../../services/orderbook.service";
import { ThemeSettings } from "../../../../shared/models/settings/theme-settings.model";

@Component({
  template: '',
})
export abstract class OrderbookTableBaseComponent {
  @Input() guid!: string;
  @Input() ob: OrderBook | null = null;
  @Input() shouldShowYield: boolean | null = null;
  @Input() themeSettings?: ThemeSettings;
  @Input() maxVolume = 1;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly widgetsDataProvider: WidgetsDataProviderService,
    private readonly modal: ModalService,
    private readonly service: OrderbookService,
  ) {
  }

  newLimitOrder(event: MouseEvent, price: number, quantity?: number) {
    event.stopPropagation();
    this.settingsService.getSettings<OrderbookSettings>(this.guid).pipe(
      take(1)
    ).subscribe(settings => {
      if (settings.useOrderWidget) {
        this.widgetsDataProvider.setDataProviderValue<SelectedPriceData>('selectedPrice',{price, badgeColor: settings.badgeColor!});
      } else {
        const params: CommandParams = {
          instrument: { ...settings },
          price,
          quantity: quantity ?? 1,
          type: CommandType.Limit,
        };
        this.modal.openCommandModal(params);
      }
    });
  }

  updateOrderPrice(order: CurrentOrder, price: number) {
    this.modal.openEditModal({
      type: order.type,
      quantity: order.volume,
      orderId: order.orderId,
      price: price,
      instrument: {
        symbol: order.symbol,
        exchange: order.exchange
      },
      user: {
        portfolio: order.portfolio,
        exchange: order.exchange
      },
      side: order.side
    });
  }

  cancelOrder(event: MouseEvent, orders: CurrentOrder[]) {
    event.stopPropagation();
    for (const order of orders) {
      this.service.cancelOrder(order);
    }
  }

  getBidStyle(value: number) {
    if(!this.themeSettings) {
      return null;
    }

    const size = 100 * (value / this.maxVolume);
    return {
      background: `linear-gradient(270deg, ${this.themeSettings.themeColors.buyColorBackground} ${size}% , rgba(0,0,0,0) ${size}%)`,
    };
  }

  getAskStyle(value: number) {
    if(!this.themeSettings) {
      return null;
    }

    const size = 100 * (value / this.maxVolume);
    return {
      background: `linear-gradient(90deg, ${this.themeSettings.themeColors.sellColorBackground} ${size}%, rgba(0,0,0,0) ${size}%)`,
    };
  }

  getTrackKey(index: number): number {
    return index;
  }
}
