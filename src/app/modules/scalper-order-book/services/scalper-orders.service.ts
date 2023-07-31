import { Injectable } from '@angular/core';
import { OrderCancellerService } from "../../../shared/services/order-canceller.service";
import { CancelCommand } from "../../../shared/models/commands/cancel-command.model";
import { take } from "rxjs";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { Position } from "../../../shared/models/positions/position.model";
import { OrderService } from "../../../shared/services/orders/order.service";
import { Side } from "../../../shared/models/enums/side.model";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { ModalService } from "../../../shared/services/modal.service";
import { LimitOrder, MarketOrder, StopLimitOrder, StopMarketOrder } from "../../command/models/order.model";
import { CommandType } from "../../../shared/models/enums/command-type.model";
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { CurrentOrderDisplay, } from '../models/scalper-order-book.model';
import { OrderbookData } from '../../orderbook/models/orderbook-data.model';
import { MathHelper } from '../../../shared/utils/math-helper';
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { OrderPriceUnits, ScalperOrderBookSettings } from "../models/scalper-order-book-settings.model";
import { ExecutionPolicy } from "../../../shared/models/orders/orders-group.model";

@Injectable({
  providedIn: 'root'
})
export class ScalperOrdersService {

  constructor(
    private readonly orderCancellerService: OrderCancellerService,
    private readonly orderService: OrderService,
    private readonly notification: NzNotificationService,
    private readonly modal: ModalService
  ) {
  }

  cancelOrders(currentOrders: CurrentOrderDisplay[]): void {
    for (const order of currentOrders) {
      const command: CancelCommand = {
        orderid: order.orderId,
        exchange: order.exchange,
        portfolio: order.portfolio,
        stop: order.type === 'stop' || order.type === 'stoplimit'
      };

      this.orderCancellerService.cancelOrder(command).pipe(
        take(1)
      ).subscribe();
    }
  }

  closePositionsByMarket(position: Position | null, instrumentGroup: string | undefined, portfolio: PortfolioKey): void {
    if (!position || !position.qtyTFutureBatch) {
      return;
    }

    this.orderService.submitMarketOrder({
        side: position.qtyTFutureBatch > 0 ? Side.Sell : Side.Buy,
        quantity: Math.abs(position.qtyTFutureBatch),
        instrument: {
          symbol: position.symbol,
          exchange: position.exchange,
          instrumentGroup: instrumentGroup
        },
      },
      portfolio.portfolio
    ).subscribe();
  }

  placeBestOrder(
    settings: ScalperOrderBookSettings,
    instrument: Instrument,
    side: Side,
    quantity: number,
    orderBook: OrderbookData,
    portfolio: PortfolioKey,
    position: Position | null
  ): void {
    if (orderBook.a.length === 0 || orderBook.b.length === 0) {
      return;
    }

    let price: number | undefined;

    const bestAsk = orderBook.a[0].p;
    const bestBid = orderBook.b[0].p;

    const pricePrecision = Math.max(
      MathHelper.getPrecision(instrument.minstep),
      MathHelper.getPrecision(bestAsk),
      MathHelper.getPrecision(bestBid)
    );

    const diff = MathHelper.round(bestAsk - bestBid, pricePrecision);

    if (diff > instrument.minstep) {
      price = side === Side.Sell
        ? bestAsk - instrument.minstep
        : bestBid + instrument.minstep;

      price = MathHelper.round(price, pricePrecision);
    }
    else {
      price = side === Side.Sell
        ? bestAsk
        : bestBid;
    }

    if (price != undefined) {
      if (this.checkBracketNeeded(settings, side, quantity, position)) {
        this.placeBracket(
          {
            side: side,
            price: price!,
            quantity: quantity,
            instrument: instrument
          },
          this.getBracketOrderPrice(settings, price, instrument.minstep),
          this.getBracketOrderPrice(settings, price, instrument.minstep, false),
          portfolio.portfolio
        );
      } else {
        this.orderService.submitLimitOrder({
            side: side,
            price: price!,
            quantity: quantity,
            instrument: instrument
          },
          portfolio.portfolio)
          .subscribe();
      }
    }
  }

  sellBestBid(
    settings: ScalperOrderBookSettings,
    instrument: Instrument,
    quantity: number,
    orderBook: OrderbookData,
    portfolio: PortfolioKey,
    position: Position | null
  ): void {
    if (orderBook.b.length === 0) {
      return;
    }

    const bestBid = orderBook.b[0].p;

    if (this.checkBracketNeeded(settings, Side.Sell, quantity, position)) {
      this.placeBracket({
          side: Side.Sell,
          quantity: quantity,
          price: bestBid!,
          instrument: settings
        },
        this.getBracketOrderPrice(settings, bestBid, instrument.minstep),
        this.getBracketOrderPrice(settings, bestBid, instrument.minstep, false),
        portfolio.portfolio
      );
    } else {
      this.orderService.submitLimitOrder({
          side: Side.Sell,
          price: bestBid!,
          quantity: quantity,
          instrument: settings
        },
        portfolio.portfolio)
        .subscribe();
    }
  }

  buyBestAsk(
    settings: ScalperOrderBookSettings,
    instrument: Instrument,
    quantity: number,
    orderBook: OrderbookData,
    portfolio: PortfolioKey,
    position: Position | null
  ): void {
    if (orderBook.a.length === 0) {
      return;
    }

    const bestAsk = orderBook.a[0].p;

    if (this.checkBracketNeeded(settings, Side.Buy, quantity, position)) {
      this.placeBracket({
        side: Side.Buy,
        quantity: quantity,
        price: bestAsk!,
        instrument: settings
      },
        this.getBracketOrderPrice(settings, bestAsk, instrument.minstep),
        this.getBracketOrderPrice(settings, bestAsk, instrument.minstep, false),
        portfolio.portfolio
        );
    } else {
      this.orderService.submitLimitOrder({
          side: Side.Buy,
          price: bestAsk!,
          quantity: quantity,
          instrument: settings
        },
        portfolio.portfolio)
        .subscribe();
    }
  }

  placeMarketOrder(instrumentKey: InstrumentKey, side: Side, quantity: number, silent: boolean, portfolio: PortfolioKey): void {
    const order: MarketOrder = {
      side: side,
      quantity: quantity,
      instrument: instrumentKey
    };

    if (silent) {
      this.orderService.submitMarketOrder(order, portfolio.portfolio).subscribe();
    }
    else {
      this.modal.openCommandModal({
        ...order,
        type: CommandType.Market
      });
    }
  }

  placeLimitOrder(
    settings: ScalperOrderBookSettings,
    instrument: Instrument,
    side: Side,
    quantity: number,
    price: number,
    silent: boolean,
    portfolio: PortfolioKey,
    position: Position | null
  ) {
    const order: LimitOrder = {
      side: side,
      quantity: quantity,
      price: price,
      instrument: settings
    };

    const topOrderPrice = this.getBracketOrderPrice(settings, price, instrument.minstep);
    const bottomOrderPrice = this.getBracketOrderPrice(settings, price, instrument.minstep, false);

    if (silent) {
      if (
        this.checkBracketNeeded(settings, side, quantity, position)
      ) {
        this.placeBracket(order, topOrderPrice, bottomOrderPrice, portfolio.portfolio);
      } else {
        this.orderService.submitLimitOrder(order, portfolio.portfolio).subscribe();
      }
    }
    else {
      if (
        this.checkBracketNeeded(settings, side, quantity, position)
      ) {
        this.modal.openCommandModal({
          ...order,
          topOrderPrice,
          topOrderSide: side === Side.Buy ? Side.Sell : Side.Buy,
          bottomOrderPrice,
          bottomOrderSide: side === Side.Buy ? Side.Sell : Side.Buy,
          type: CommandType.Limit
        });
      } else {
        this.modal.openCommandModal({
          ...order,
          type: CommandType.Limit
        });
      }
    }
  }

  reversePositionsByMarket(position: Position | null, instrumentGroup: string | undefined, portfolio: PortfolioKey): void {
    if (!position || !position.qtyTFutureBatch) {
      return;
    }

    this.orderService.submitMarketOrder({
        side: position.qtyTFutureBatch > 0 ? Side.Sell : Side.Buy,
        quantity: Math.abs(position.qtyTFutureBatch * 2),
        instrument: {
          symbol: position.symbol,
          exchange: position.exchange,
          instrumentGroup: instrumentGroup
        },
      },
      portfolio.portfolio
    ).subscribe();
  }

  setStopLimit(
    instrumentKey: InstrumentKey,
    price: number,
    quantity: number,
    side: Side,
    silent: boolean,
    portfolio: PortfolioKey): void {

    const order: StopLimitOrder = {
      side: side,
      quantity: quantity,
      price: price,
      instrument: instrumentKey,
      triggerPrice: price,
      condition: side === Side.Sell ? LessMore.More : LessMore.Less
    } as StopLimitOrder;

    if (silent) {
      this.orderService.submitStopLimitOrder(order, portfolio.portfolio).subscribe();
    }
    else {
      this.modal.openCommandModal({
        ...order,
        type: CommandType.Stop,
        stopEndUnixTime: undefined
      });
    }
  }

  setStopLoss(price: number, silent: boolean, position: Position | null, instrumentGroup: string | undefined, portfolio: PortfolioKey): void {
    if (!position || position.qtyTFutureBatch === 0 || !position.avgPrice) {
      this.notification.error('Нет позиций', 'Позиции для установки стоп-лосс отсутствуют');
      return;
    }

    const side = position.qtyTFutureBatch < 0 ? Side.Buy : Side.Sell;

    if (side === Side.Sell && price >= position.avgPrice) {
      this.notification.warning('Некорректная цена', `Для установки стоп-лосс цена должна быть меньше ${position.avgPrice}`);
      return;
    }

    if (side === Side.Buy && price <= position.avgPrice) {
      this.notification.warning('Некорректная цена', `Для установки стоп-лосс цена должна быть больше ${position.avgPrice}`);
      return;
    }

    const order: StopMarketOrder = {
      side: side,
      quantity: Math.abs(position.qtyTFutureBatch),
      instrument: {
        symbol: position.symbol,
        exchange: position.exchange,
        instrumentGroup: instrumentGroup
      },
      triggerPrice: price,
      condition: side === Side.Sell ? LessMore.Less : LessMore.More
    } as StopMarketOrder;

    if (silent) {
      this.orderService.submitStopMarketOrder(order, portfolio.portfolio).subscribe();
    }
    else {
      this.modal.openCommandModal({
        ...order,
        type: CommandType.Stop,
        stopEndUnixTime: undefined
      });
    }
  }

  updateOrders(currentOrders: CurrentOrderDisplay[], updates: { price: number }, silent: boolean): void {
    if(currentOrders.length === 0) {
      return;
    }

    if(silent) {
      for (const order of currentOrders) {
        if(order.type === 'limit') {
          this.orderService.submitLimitOrderEdit({
            id: order.orderId,
            price: updates.price,
            quantity: order.displayVolume,
            instrument: {
              symbol: order.symbol,
              exchange: order.exchange
            }
          },
            order.portfolio
          ).subscribe();
        }
      }
    } else {
      const order = currentOrders[0];

      this.modal.openEditModal({
        type: order.type,
        quantity: order.displayVolume,
        orderId: order.orderId,
        price: updates.price,
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
  }

  placeBracket(baseOrder: LimitOrder, topOrderPrice: number | null, bottomOrderPrice: number | null, portfolio: string) {
    const orders: ((LimitOrder | StopLimitOrder) & { type: 'Limit' | 'StopLimit' })[] = [{
      ...baseOrder,
      type: 'Limit',
    }];

    if (topOrderPrice) {
      orders.push({
        ...baseOrder,
        condition: LessMore.More,
        triggerPrice: topOrderPrice!,
        side: baseOrder.side === Side.Buy ? Side.Sell : Side.Buy,
        type: 'StopLimit',
        activate: false
      } as StopLimitOrder & { type: 'StopLimit' });
    }

    if (bottomOrderPrice) {
      orders.push({
        ...baseOrder,
        condition: LessMore.Less,
        triggerPrice: bottomOrderPrice!,
        side: baseOrder.side === Side.Buy ? Side.Sell : Side.Buy,
        type: 'StopLimit',
        activate: false
      } as StopLimitOrder & { type: 'StopLimit' });
    }

    this.orderService.submitOrdersGroup(orders, portfolio, ExecutionPolicy.TriggerBracketOrders).subscribe();
  }

  private checkBracketNeeded(settings: ScalperOrderBookSettings, side: Side, quantity: number, position: Position | null): boolean {
    const isClosingPosition = position
      ? side === Side.Sell
        ? Math.abs(position.qtyTFuture - quantity) < Math.abs(position.qtyTFuture)
        : Math.abs(position.qtyTFuture + quantity) < Math.abs(position.qtyTFuture)
      : false;

    return !!(settings.useLinkedOrders &&
      (settings.topOrderPriceRatio || settings.bottomOrderPriceRatio) &&
      (settings.useLinkedOrdersWhenClosingPosition || !isClosingPosition));
  }

  private getBracketOrderPrice(settings: ScalperOrderBookSettings, price: number, minStep: number, isTopOrder = true): number | null {
    if (!settings.orderPriceUnits || settings.orderPriceUnits === OrderPriceUnits.Steps) {
      return isTopOrder
        ? settings.topOrderPriceRatio
          ? price + (settings.topOrderPriceRatio * minStep)
          : null
        : settings.bottomOrderPriceRatio
          ? price - (settings.bottomOrderPriceRatio * minStep)
          : null;
    }

    return isTopOrder
      ? settings.topOrderPriceRatio
        ? (1 + settings.topOrderPriceRatio * 0.01) * price
        : null
      : settings.bottomOrderPriceRatio
        ? (1 - settings.bottomOrderPriceRatio * 0.01) * price
        : null;
  }
}
