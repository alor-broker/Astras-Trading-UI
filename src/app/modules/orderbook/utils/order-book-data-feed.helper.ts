import { Order } from "../../../shared/models/orders/order.model";
import { OrderbookRequest } from '../models/orderbook-data.model';
import { CurrentOrder } from '../models/orderbook-view-row.model';

export class OrderBookDataFeedHelper {
  public static getRealtimeDateRequest(symbol: string,
                                       exchange: string,
                                       instrumentGroup?: string | null,
                                       depth?: number): OrderbookRequest {
    return {
      opcode: 'OrderBookGetAndSubscribe',
      code: symbol,
      exchange: exchange,
      depth: depth ?? 17,
      format: 'slim',
      instrumentGroup: instrumentGroup,
    };
  }

  public static getCurrentOrdersForItem(itemPrice: number, orders: Order[]): CurrentOrder[] {
    const currentOrders = orders.filter(
      (o) => o.price === itemPrice
        && o.status === 'working'
    );

    return currentOrders.map(o => this.orderToCurrentOrder(o));
  }

  public static orderToCurrentOrder(order: Order): CurrentOrder {
    return {
      orderId: order.id,
      exchange: order.exchange,
      portfolio: order.portfolio,
      price: order.price,
      volume: order.qty - (order.filledQtyBatch ?? 0),
      type: order.type,
      side: order.side,
      symbol: order.symbol
    } as CurrentOrder;
  }

  public static getOrderbookSubscriptionId: (request: OrderbookRequest) => string = request =>
    `${request.opcode}_${request.code}_${request.exchange}_${request.instrumentGroup}_${request.depth}_${request.format}`;
}
