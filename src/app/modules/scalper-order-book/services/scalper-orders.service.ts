import { Injectable } from '@angular/core';
import { take } from "rxjs";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { Position } from "../../../shared/models/positions/position.model";
import { Side } from "../../../shared/models/enums/side.model";
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { CurrentOrderDisplay, } from '../models/scalper-order-book.model';
import { OrderbookData } from '../../orderbook/models/orderbook-data.model';
import { MathHelper } from '../../../shared/utils/math-helper';
import { LessMore } from "../../../shared/models/enums/less-more.model";
import {
  PriceUnits,
  ScalperOrderBookWidgetSettings
} from "../models/scalper-order-book-settings.model";
import { ExecutionPolicy } from "../../../shared/models/orders/orders-group.model";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import {
  NewLimitOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder
} from "../../../shared/models/orders/new-order.model";
import { CommonOrderCommands } from "../../../shared/utils/common-order-commands";
import { ScalperOrderBookInstantTranslatableNotificationsService } from "./scalper-order-book-instant-translatable-notifications.service";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { OrderType } from "../../../shared/models/orders/order.model";
import { OrderFormType } from "../../../shared/models/orders/orders-dialog.model";
import { OrdersGroupService } from "../../../shared/services/orders/orders-group.service";

enum BracketOrderType {
  Top = 'top',
  Bottom = 'bottom'
}

@Injectable({
  providedIn: 'root'
})
export class ScalperOrdersService {

  constructor(
    private readonly notification: ScalperOrderBookInstantTranslatableNotificationsService,
    private readonly ordersDialogService: OrdersDialogService,
    private readonly wsOrdersService: WsOrdersService,
    private readonly ordersGroupService: OrdersGroupService
  ) {
  }

  cancelOrders(currentOrders: CurrentOrderDisplay[]): void {
    this.wsOrdersService.cancelOrders(
      currentOrders.map(o => ({
        orderId: o.orderId,
        orderType: o.type,
        exchange: o.exchange,
        portfolio: o.portfolio
      }))
    ).pipe(
      take(1)
    ).subscribe();
  }

  closePositionsByMarket(position: Position | null, instrumentGroup: string | null): void {
    if (!position || !position.qtyTFutureBatch) {
      return;
    }

    CommonOrderCommands.closePositionByMarket(
      position,
      instrumentGroup,
      this.wsOrdersService
    );
  }

  placeBestOrder(
    settings: ScalperOrderBookWidgetSettings,
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

    let price: number | null;

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
    } else {
      price = side === Side.Sell
        ? bestAsk
        : bestBid;
    }

    if ((price as number | undefined) != null) {
      if (this.checkBracketNeeded(settings, side, quantity, position)) {
        this.placeBracket(
          {
            side: side,
            price: price!,
            quantity: quantity,
            instrument: toInstrumentKey(instrument)
          },
          this.getBracketOrderPrice(settings, price, instrument.minstep, BracketOrderType.Top, side),
          this.getBracketOrderPrice(settings, price, instrument.minstep, BracketOrderType.Bottom, side),
          portfolio.portfolio
        );
      } else {
        this.wsOrdersService.submitLimitOrder({
            side: side,
            price: price!,
            quantity: quantity,
            instrument: toInstrumentKey(instrument)
          },
          portfolio.portfolio)
          .subscribe();
      }
    }
  }

  sellBestBid(
    settings: ScalperOrderBookWidgetSettings,
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
          instrument: toInstrumentKey(settings)
        },
        this.getBracketOrderPrice(settings, bestBid, instrument.minstep, BracketOrderType.Top, Side.Sell),
        this.getBracketOrderPrice(settings, bestBid, instrument.minstep, BracketOrderType.Bottom, Side.Sell),
        portfolio.portfolio
      );
    } else {
      this.wsOrdersService.submitLimitOrder({
          side: Side.Sell,
          price: bestBid!,
          quantity: quantity,
          instrument: toInstrumentKey(settings)
        },
        portfolio.portfolio)
        .subscribe();
    }
  }

  buyBestAsk(
    settings: ScalperOrderBookWidgetSettings,
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
          instrument: toInstrumentKey(settings)
        },
        this.getBracketOrderPrice(settings, bestAsk, instrument.minstep, BracketOrderType.Top, Side.Buy),
        this.getBracketOrderPrice(settings, bestAsk, instrument.minstep, BracketOrderType.Bottom, Side.Buy),
        portfolio.portfolio
      );
    } else {
      this.wsOrdersService.submitLimitOrder({
          side: Side.Buy,
          price: bestAsk!,
          quantity: quantity,
          instrument: toInstrumentKey(settings)
        },
        portfolio.portfolio)
        .subscribe();
    }
  }

  placeMarketOrder(instrumentKey: InstrumentKey, side: Side, quantity: number, silent: boolean, portfolio: PortfolioKey): void {
    const order: NewMarketOrder = {
      side: side,
      quantity: quantity,
      instrument: toInstrumentKey(instrumentKey)
    };

    if (silent) {
      this.wsOrdersService.submitMarketOrder(order, portfolio.portfolio).subscribe();
    } else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: toInstrumentKey(order.instrument),
        initialValues: {
          orderType: OrderFormType.Market,
          quantity: order.quantity
        }
      });
    }
  }

  placeLimitOrder(
    settings: ScalperOrderBookWidgetSettings,
    instrument: Instrument,
    side: Side,
    quantity: number,
    price: number,
    silent: boolean,
    portfolio: PortfolioKey,
    position: Position | null
  ): void {
    const topOrderPrice = this.getBracketOrderPrice(settings, price, instrument.minstep, BracketOrderType.Top, side);
    const bottomOrderPrice = this.getBracketOrderPrice(settings, price, instrument.minstep, BracketOrderType.Bottom, side);

    if (silent) {
      const order: NewLimitOrder = {
        side: side,
        quantity: quantity,
        price: price,
        instrument: toInstrumentKey(settings)
      };

      if (
        this.checkBracketNeeded(settings, side, quantity, position)
      ) {
        this.placeBracket(order, topOrderPrice, bottomOrderPrice, portfolio.portfolio);
      } else {
        this.wsOrdersService.submitLimitOrder(order, portfolio.portfolio).subscribe();
      }
    } else {
      if (this.checkBracketNeeded(settings, side, quantity, position)) {
        const bracketSide = side === Side.Buy ? Side.Sell : Side.Buy;
        this.ordersDialogService.openNewOrderDialog({
          instrumentKey: toInstrumentKey(settings),
          initialValues: {
            orderType: OrderFormType.Limit,
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
            orderType: OrderFormType.Limit,
            quantity,
            price
          }
        });
      }
    }
  }

  reversePositionsByMarket(position: Position | null, instrumentGroup: string | null): void {
    if (!position || !position.qtyTFutureBatch) {
      return;
    }

    CommonOrderCommands.reversePositionsByMarket(position, instrumentGroup, this.wsOrdersService);
  }

  setStopLimit(
    instrument: Instrument,
    price: number,
    quantity: number,
    side: Side,
    distance: number,
    silent: boolean,
    portfolio: PortfolioKey): void {

    const limitOrderPrice = side === Side.Sell
      ? MathHelper.roundPrice(price - distance * instrument.minstep, instrument.minstep)
      : MathHelper.roundPrice(price + distance * instrument.minstep, instrument.minstep);

    const order: NewStopLimitOrder = {
      side: side,
      quantity: quantity,
      triggerPrice: price,
      price: limitOrderPrice,
      condition: side === Side.Buy ? LessMore.MoreOrEqual : LessMore.LessOrEqual,
      instrument: toInstrumentKey(instrument),
    };

    if (silent) {
      this.wsOrdersService.submitStopLimitOrder(order, portfolio.portfolio).subscribe();
    } else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: toInstrumentKey(order.instrument),
        initialValues: {
          orderType: OrderFormType.Stop,
          price: order.price,
          quantity: order.quantity,
          stopOrder: {
            triggerPrice: order.triggerPrice,
            condition: order.condition,
            limit: true,
            disableCalculations: true
          }
        }
      });
    }
  }

  setStopLoss(price: number, silent: boolean, position: Position | null, instrumentGroup: string | null, portfolio: PortfolioKey): void {
    if (!position || position.qtyTFutureBatch === 0 || !position.avgPrice) {
      this.notification.emptyPositions();
      return;
    }

    const side = position.qtyTFutureBatch < 0 ? Side.Buy : Side.Sell;

    const order: NewStopMarketOrder = {
      side: side,
      quantity: Math.abs(position.qtyTFutureBatch),
      instrument: {
        symbol: position.symbol,
        exchange: position.exchange,
        instrumentGroup: instrumentGroup
      },
      triggerPrice: price,
      condition: side === Side.Sell ? LessMore.LessOrEqual : LessMore.MoreOrEqual
    };

    if (silent) {
      this.wsOrdersService.submitStopMarketOrder(order, portfolio.portfolio).subscribe();
    } else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: toInstrumentKey(order.instrument),
        initialValues: {
          orderType: OrderFormType.Stop,
          quantity: order.quantity,
          price: order.triggerPrice,
          stopOrder: {
            condition: order.condition,
            disableCalculations: true
          }
        }
      });
    }
  }

  updateOrders(currentOrders: CurrentOrderDisplay[], updates: { price: number }, silent: boolean): void {
    if (currentOrders.length === 0) {
      return;
    }

    if (silent) {
      for (const order of currentOrders) {
        const baseOrderEditData = {
          id: order.orderId,
          quantity: order.displayVolume,
          instrument: {
            symbol: order.symbol,
            exchange: order.exchange
          }
        };

        switch (order.type) {
          case OrderType.Limit:
            this.wsOrdersService.submitLimitOrderEdit({
                ...baseOrderEditData,
                price: updates.price,
              },
              order.portfolio
            ).subscribe();
            break;
          case OrderType.StopLimit:
            this.wsOrdersService.submitStopLimitOrderEdit({
                ...baseOrderEditData,
                condition: order.condition!,
                triggerPrice: updates.price,
                price: MathHelper.round(
                  order.price! - (order.triggerPrice! - updates.price),
                  Math.max(
                    MathHelper.getPrecision(order.price!),
                    MathHelper.getPrecision(order.triggerPrice!),
                    MathHelper.getPrecision(updates.price)
                  )
                ),
                side: order.side
              },
              order.portfolio
            ).subscribe();
            break;
          case OrderType.StopMarket:
            this.wsOrdersService.submitStopMarketOrderEdit({
                ...baseOrderEditData,
                condition: order.condition!,
                triggerPrice: updates.price,
                side: order.side
              },
              order.portfolio
            ).subscribe();
            break;
          default:
            return;
        }
      }
    } else {
      const order = currentOrders[0];
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
        orderType: order.type === OrderType.Limit ? OrderFormType.Limit : OrderFormType.Stop,
        initialValues: {
          quantity: order.displayVolume,
          price: order.type === OrderType.Limit
            ? updates.price
            : MathHelper.round(
              (order.price ?? 0) - (order.triggerPrice! - updates.price),
              Math.max(
                MathHelper.getPrecision(order.price ?? 0),
                MathHelper.getPrecision(order.triggerPrice!),
                MathHelper.getPrecision(updates.price)
              )
            ),
          triggerPrice: updates.price,
          hasPriceChanged: true
        }
      });
    }
  }

  private placeBracket(baseOrder: NewLimitOrder, topOrderPrice: number | null, bottomOrderPrice: number | null, portfolio: string): void {
    const orders: ((NewLimitOrder | NewStopLimitOrder) & { type: OrderType.Limit | OrderType.StopLimit })[] = [{
      ...baseOrder,
      type: OrderType.Limit,
    }];

    if (topOrderPrice != null) {
      orders.push({
        ...baseOrder,
        condition: LessMore.MoreOrEqual,
        triggerPrice: topOrderPrice!,
        side: baseOrder.side === Side.Buy ? Side.Sell : Side.Buy,
        type: OrderType.StopLimit,
        activate: false
      } as NewStopLimitOrder & { type: OrderType.StopLimit });
    }

    if (bottomOrderPrice != null) {
      orders.push({
        ...baseOrder,
        condition: LessMore.LessOrEqual,
        triggerPrice: bottomOrderPrice!,
        side: baseOrder.side === Side.Buy ? Side.Sell : Side.Buy,
        type: OrderType.StopLimit,
        activate: false
      } as NewStopLimitOrder & { type: OrderType.StopLimit });
    }

    this.ordersGroupService.submitOrdersGroup(orders, portfolio, ExecutionPolicy.TriggerBracketOrders).subscribe();
  }

  private checkBracketNeeded(settings: ScalperOrderBookWidgetSettings, side: Side, quantity: number, position: Position | null): boolean {
    if (settings.bracketsSettings?.topOrderPriceRatio == null && settings.bracketsSettings?.bottomOrderPriceRatio == null) {
      return false;
    }

    const isClosingPosition = position
      ? side === Side.Sell
        ? Math.abs(position!.qtyTFutureBatch - quantity) < Math.abs(position!.qtyTFutureBatch)
        : Math.abs(position!.qtyTFutureBatch + quantity) < Math.abs(position!.qtyTFutureBatch)
      : false;

    return (settings.bracketsSettings!.useBracketsWhenClosingPosition ?? false) || !isClosingPosition;
  }

  private getBracketOrderPrice(
    settings: ScalperOrderBookWidgetSettings,
    price: number,
    minStep: number,
    orderType: BracketOrderType,
    side: Side
  ): number | null {
    if (settings.bracketsSettings?.topOrderPriceRatio == null && settings.bracketsSettings?.bottomOrderPriceRatio == null) {
      return null;
    }

    let dirtyPrice: number | null;
    const topOrderPriceRatio = side === Side.Buy ? settings.bracketsSettings?.topOrderPriceRatio : settings.bracketsSettings?.bottomOrderPriceRatio;
    const bottomOrderPriceRatio = side === Side.Buy ? settings.bracketsSettings?.bottomOrderPriceRatio : settings.bracketsSettings?.topOrderPriceRatio;

    if ((settings.bracketsSettings!.orderPriceUnits ?? PriceUnits.Points) === PriceUnits.Points) {
      dirtyPrice = orderType === BracketOrderType.Top
        ? topOrderPriceRatio != null
          ? price + (topOrderPriceRatio! * minStep)
          : null
        : bottomOrderPriceRatio != null
          ? price - (bottomOrderPriceRatio! * minStep)
          : null;
    } else {
      dirtyPrice = orderType === BracketOrderType.Top
        ? topOrderPriceRatio != null
          ? (1 + topOrderPriceRatio! * 0.01) * price
          : null
        : bottomOrderPriceRatio != null
          ? (1 - bottomOrderPriceRatio! * 0.01) * price
          : null;
    }

    if (dirtyPrice == null) {
      return null;
    }

    return MathHelper.roundPrice(dirtyPrice!, minStep);
  }
}
