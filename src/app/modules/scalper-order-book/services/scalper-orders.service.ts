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
import { StopOrderCondition } from "../../../shared/models/enums/stoporder-conditions";
import {
  LimitOrder,
  MarketOrder,
  StopLimitOrder,
  StopMarketOrder
} from "../../command/models/order.model";
import { CommandType } from "../../../shared/models/enums/command-type.model";
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import {
  BodyRow,
  CurrentOrderDisplay,
  ScalperOrderBookRowType
} from '../models/scalper-order-book.model';
import { OrderbookData } from '../../orderbook/models/orderbook-data.model';
import { MathHelper } from '../../../shared/utils/math-helper';

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

  placeBestOrder(instrument: Instrument, side: Side, quantity: number, orderBook: OrderbookData, portfolio: PortfolioKey): void {
    if (orderBook.a.length === 0 || orderBook.b.length === 0) {
      return;
    }

    let price: number | undefined;

    const bestAsk = orderBook.a[0].p;
    const bestBid = orderBook.b[0].p;

    const diff = MathHelper.round(bestAsk - bestBid, MathHelper.getPrecision(instrument.minstep));

    if (diff > instrument.minstep) {
      price = side === Side.Sell
        ? bestAsk - instrument.minstep
        : bestBid + instrument.minstep;
    }
    else {
      price = side === Side.Sell
        ? bestAsk
        : bestBid;
    }

    if (price != undefined) {
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

  sellBestBid(instrumentKey: InstrumentKey, quantity: number, orderBook: OrderbookData, portfolio: PortfolioKey): void {
    if (orderBook.b.length === 0) {
      return;
    }

    const bestBid = orderBook.b[0].p;
    this.orderService.submitLimitOrder({
        side: Side.Sell,
        price: bestBid!,
        quantity: quantity,
        instrument: instrumentKey
      },
      portfolio.portfolio)
      .subscribe();
  }

  buyBestAsk(instrumentKey: InstrumentKey, quantity: number, orderBook: OrderbookData, portfolio: PortfolioKey): void {
    if (orderBook.a.length === 0) {
      return;
    }

    const bestAsk = orderBook.a[0].p;
    this.orderService.submitLimitOrder({
        side: Side.Buy,
        price: bestAsk!,
        quantity: quantity,
        instrument: instrumentKey
      },
      portfolio.portfolio)
      .subscribe();
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

  placeLimitOrder(instrumentKey: InstrumentKey, side: Side, quantity: number, price: number, silent: boolean, portfolio: PortfolioKey) {
    const order: LimitOrder = {
      side: side,
      quantity: quantity,
      price: price,
      instrument: instrumentKey
    };

    if (silent) {
      this.orderService.submitLimitOrder(order, portfolio.portfolio).subscribe();
    }
    else {
      this.modal.openCommandModal({
        ...order,
        type: CommandType.Limit
      });
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

  setStopLimitForRow(instrumentKey: InstrumentKey, row: BodyRow, quantity: number, silent: boolean, portfolio: PortfolioKey): void {
    if (row.rowType != ScalperOrderBookRowType.Bid && row.rowType != ScalperOrderBookRowType.Ask) {
      return;
    }

    const side = row.rowType === ScalperOrderBookRowType.Ask
      ? Side.Sell
      : Side.Buy;

    const order: StopLimitOrder = {
      side: side,
      quantity: quantity,
      price: row.price,
      instrument: instrumentKey,
      triggerPrice: row.price,
      condition: side === Side.Sell ? StopOrderCondition.More : StopOrderCondition.Less,
    };

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
      condition: side === Side.Sell ? StopOrderCondition.Less : StopOrderCondition.More
    };

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
}
