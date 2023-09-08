import {Injectable} from '@angular/core';
import {OrderCancellerService} from "../../../shared/services/order-canceller.service";
import {CancelCommand} from "../../../shared/models/commands/cancel-command.model";
import {take} from "rxjs";
import {InstrumentKey} from "../../../shared/models/instruments/instrument-key.model";
import {PortfolioKey} from "../../../shared/models/portfolio-key.model";
import {Position} from "../../../shared/models/positions/position.model";
import {OrderService} from "../../../shared/services/orders/order.service";
import {Side} from "../../../shared/models/enums/side.model";
import {NzNotificationService} from "ng-zorro-antd/notification";
import {Instrument} from '../../../shared/models/instruments/instrument.model';
import {CurrentOrderDisplay,} from '../models/scalper-order-book.model';
import {OrderbookData} from '../../orderbook/models/orderbook-data.model';
import {MathHelper} from '../../../shared/utils/math-helper';
import {LessMore} from "../../../shared/models/enums/less-more.model";
import {PriceUnits, ScalperOrderBookSettings} from "../models/scalper-order-book-settings.model";
import {ExecutionPolicy} from "../../../shared/models/orders/orders-group.model";
import {OrdersDialogService} from "../../../shared/services/orders/orders-dialog.service";
import {OrderType} from "../../../shared/models/orders/orders-dialog.model";
import {toInstrumentKey} from "../../../shared/utils/instruments";
import {
  NewLimitOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder
} from "../../../shared/models/orders/new-order.model";

enum BracketOrderType {
  Top = 'top',
  Bottom = 'bottom'
}

@Injectable({
  providedIn: 'root'
})
export class ScalperOrdersService {

  constructor(
    private readonly orderCancellerService: OrderCancellerService,
    private readonly orderService: OrderService,
    private readonly notification: NzNotificationService,
    private readonly ordersDialogService: OrdersDialogService,
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
          this.getBracketOrderPrice(settings, price, instrument.minstep, BracketOrderType.Top),
          this.getBracketOrderPrice(settings, price, instrument.minstep, BracketOrderType.Bottom),
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
        this.getBracketOrderPrice(settings, bestBid, instrument.minstep, BracketOrderType.Top),
        this.getBracketOrderPrice(settings, bestBid, instrument.minstep, BracketOrderType.Bottom),
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
        this.getBracketOrderPrice(settings, bestAsk, instrument.minstep, BracketOrderType.Top),
        this.getBracketOrderPrice(settings, bestAsk, instrument.minstep, BracketOrderType.Bottom),
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
    const order: NewMarketOrder = {
      side: side,
      quantity: quantity,
      instrument: instrumentKey
    };

    if (silent) {
      this.orderService.submitMarketOrder(order, portfolio.portfolio).subscribe();
    }
    else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: order.instrument,
        initialValues: {
          orderType: OrderType.Market,
          quantity: order.quantity
        }
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
    const topOrderPrice = this.getBracketOrderPrice(settings, price, instrument.minstep, BracketOrderType.Top);
    const bottomOrderPrice = this.getBracketOrderPrice(settings, price, instrument.minstep, BracketOrderType.Bottom);

    if (silent) {
      const order: NewLimitOrder = {
        side: side,
        quantity: quantity,
        price: price,
        instrument: settings
      };

      if (
        this.checkBracketNeeded(settings, side, quantity, position)
      ) {
        this.placeBracket(order, topOrderPrice, bottomOrderPrice, portfolio.portfolio);
      } else {
        this.orderService.submitLimitOrder(order, portfolio.portfolio).subscribe();
      }
    }
    else {
      if (this.checkBracketNeeded(settings, side, quantity, position)) {
        this.ordersDialogService.openNewOrderDialog({
          instrumentKey: toInstrumentKey(settings),
          initialValues: {
            orderType: OrderType.Limit,
            quantity,
            price
          }
        });
        const bracketSide = Side.Buy ? Side.Sell : Side.Buy;
        this.ordersDialogService.openNewOrderDialog({
          instrumentKey: toInstrumentKey(settings),
          initialValues: {
            orderType: OrderType.Limit,
            quantity,
            price,
            bracket: {
              topOrderPrice,
              topOrderSide: bracketSide,
              bottomOrderPrice,
              bottomOrderSide: bracketSide
            }
          }
        });
      } else {
        this.ordersDialogService.openNewOrderDialog({
          instrumentKey: toInstrumentKey(settings),
          initialValues: {
            orderType: OrderType.Limit,
            quantity,
            price
          }
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

    const order: NewStopLimitOrder = {
      side: side,
      quantity: quantity,
      price: price,
      instrument: instrumentKey,
      triggerPrice: price,
      condition: side === Side.Sell ? LessMore.More : LessMore.Less
    };

    if (silent) {
      this.orderService.submitStopLimitOrder(order, portfolio.portfolio).subscribe();
    }
    else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: order.instrument,
        initialValues: {
          orderType: OrderType.Stop,
          price: order.price,
          quantity: order.quantity,
          stopOrder: {
            condition: order.condition,
            limit: true
          }
        }
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

    const order: NewStopMarketOrder = {
      side: side,
      quantity: Math.abs(position.qtyTFutureBatch),
      instrument: {
        symbol: position.symbol,
        exchange: position.exchange,
        instrumentGroup: instrumentGroup
      },
      triggerPrice: price,
      condition: side === Side.Sell ? LessMore.Less : LessMore.More
    };

    if (silent) {
      this.orderService.submitStopMarketOrder(order, portfolio.portfolio).subscribe();
    }
    else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: order.instrument,
        initialValues: {
          orderType: OrderType.Stop,
          quantity: order.quantity,
          price: order.triggerPrice,
          stopOrder: {
            condition: order.condition
          }
        }
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
      if(order.type !== 'stop' && order.type !== 'stoplimit') {
        return;
      }

      this.ordersDialogService.openEditOrderDialog({
        instrumentKey: {
          symbol: order.symbol,
          exchange: order.exchange
        },
        portfolioKey: {
          portfolio: order.portfolio,
          exchange: order.exchange
        },
        orderId: order.orderId,
        orderType: OrderType.Stop,
        initialValues: {
          quantity: order.displayVolume,
          price: updates.price
        }
      });
    }
  }

  private placeBracket(baseOrder: NewLimitOrder, topOrderPrice: number | null, bottomOrderPrice: number | null, portfolio: string) {
    const orders: ((NewLimitOrder | NewStopLimitOrder) & { type: 'Limit' | 'StopLimit' })[] = [{
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
      } as NewStopLimitOrder & { type: 'StopLimit' });
    }

    if (bottomOrderPrice) {
      orders.push({
        ...baseOrder,
        condition: LessMore.Less,
        triggerPrice: bottomOrderPrice!,
        side: baseOrder.side === Side.Buy ? Side.Sell : Side.Buy,
        type: 'StopLimit',
        activate: false
      } as NewStopLimitOrder & { type: 'StopLimit' });
    }

    this.orderService.submitOrdersGroup(orders, portfolio, ExecutionPolicy.TriggerBracketOrders).subscribe();
  }

  private checkBracketNeeded(settings: ScalperOrderBookSettings, side: Side, quantity: number, position: Position | null): boolean {
    if (!settings.useBrackets || (!settings.bracketsSettings?.topOrderPriceRatio && !settings.bracketsSettings?.bottomOrderPriceRatio)) {
      return false;
    }

    const isClosingPosition = position
      ? side === Side.Sell
        ? Math.abs(position.qtyTFutureBatch - quantity) < Math.abs(position.qtyTFutureBatch)
        : Math.abs(position.qtyTFutureBatch + quantity) < Math.abs(position.qtyTFutureBatch)
      : false;

    return settings.bracketsSettings.useBracketsWhenClosingPosition || !isClosingPosition;
  }

  private getBracketOrderPrice(settings: ScalperOrderBookSettings, price: number, minStep: number, orderType: BracketOrderType): number | null {
    if (!settings.useBrackets) {
      return null;
    }

    let dirtyPrice: number | null;

    if (!settings.bracketsSettings!.orderPriceUnits || settings.bracketsSettings!.orderPriceUnits === PriceUnits.Points) {
      dirtyPrice = orderType === BracketOrderType.Top
        ? settings.bracketsSettings!.topOrderPriceRatio
          ? price + (settings.bracketsSettings!.topOrderPriceRatio * minStep)
          : null
        : settings.bracketsSettings!.bottomOrderPriceRatio
          ? price - (settings.bracketsSettings!.bottomOrderPriceRatio * minStep)
          : null;
    } else {
      dirtyPrice = orderType === BracketOrderType.Top
        ? settings.bracketsSettings!.topOrderPriceRatio
          ? (1 + settings.bracketsSettings!.topOrderPriceRatio * 0.01) * price
          : null
        : settings.bracketsSettings!.bottomOrderPriceRatio
          ? (1 - settings.bracketsSettings!.bottomOrderPriceRatio * 0.01) * price
          : null;
    }

    return dirtyPrice && MathHelper.roundPrice(dirtyPrice, minStep);
  }
}
