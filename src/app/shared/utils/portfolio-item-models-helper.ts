import {Order, OrderResponse, StopOrder, StopOrderResponse} from "../models/orders/order.model";
import {PortfolioKey} from "../models/portfolio-key.model";
import {Position, PositionResponse} from "../models/positions/position.model";
import {RepoTrade, RepoTradeResponse, Trade, TradeResponse} from "../models/trades/trade.model";

export class PortfolioItemsModelHelper {
  static orderResponseToModel(response: OrderResponse, portfolio: PortfolioKey): Order {
    return {
      ...response,
      ownedPortfolio: {...portfolio},
      targetInstrument: {
        exchange: response.exchange,
        symbol: response.symbol,
        instrumentGroup: response.board
      },
      transTime: new Date(response.transTime),
      endTime: response.endTime != null ? new Date(response.endTime) : response.endTime ,
    };
  }

  static stopOrderResponseToModel(response: StopOrderResponse, portfolio: PortfolioKey): StopOrder {
    return {
      ...this.orderResponseToModel(response, portfolio),
      triggerPrice: response.stopPrice,
      conditionType: response.condition
    };
  }

  static positionResponseToModel(response: PositionResponse, portfolio: PortfolioKey): Position {
    return {
      ...response,
      ownedPortfolio: {...portfolio},
      targetInstrument: {
        exchange: response.exchange,
        symbol: response.symbol
      }
    };
  }

  static tradeResponseToModel(response: TradeResponse, portfolio: PortfolioKey): Trade {
    return {
      ...response,
      ownedPortfolio: {...portfolio},
      targetInstrument: {
        exchange: response.exchange,
        symbol: response.symbol,
        instrumentGroup: response.board
      },
      date: new Date(response.date)
    };
  }

  static repoTradeResponseToModel(response: RepoTradeResponse, portfolio: PortfolioKey): RepoTrade {
    return {
      ...this.tradeResponseToModel(response, portfolio),
      repoSpecificFields: response.repoSpecificFields
    };
  }
}
