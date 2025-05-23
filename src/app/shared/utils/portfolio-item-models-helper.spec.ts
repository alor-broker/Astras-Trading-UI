import { PortfolioItemsModelHelper } from './portfolio-item-models-helper';
import { OrderResponse, OrderType, StopOrderResponse } from '../models/orders/order.model';
import { PortfolioKey, MarketType } from '../models/portfolio-key.model';
import { PositionResponse } from '../models/positions/position.model';
import { RepoTradeResponse, TradeResponse, RepoSpecificFields } from '../models/trades/trade.model';
import { Side } from '../models/enums/side.model';

describe('PortfolioItemsModelHelper', () => {
  const mockPortfolio: PortfolioKey = {
    portfolio: 'D12345',
    exchange: 'MOEX',
    marketType: MarketType.Stock
  };

  describe('orderResponseToModel', () => {
    const mockOrderResponse: OrderResponse = {
      id: '123',
      symbol: 'SBER',
      exchange: 'MOEX',
      board: 'TQBR',
      portfolio: 'D12345',
      type: OrderType.Limit,
      side: Side.Buy,
      status: 'working',
      qtyUnits: 10,
      qtyBatch: 1,
      qty: 1,
      filledQtyUnits: 0,
      price: 100,
      transTime: new Date('2023-07-15T10:00:00Z'),
      endTime: new Date('2023-07-16T10:00:00Z'),
      existing: true,
      volume: 1000,
      comment: 'test order'
    };

    it('should correctly map OrderResponse to Order model', () => {
      const result = PortfolioItemsModelHelper.orderResponseToModel(mockOrderResponse, mockPortfolio);

      expect(result.id).toBe(mockOrderResponse.id);
      // Properties from Omit<OrderResponse, 'symbol' | 'exchange' | 'board' | 'portfolio'>
      expect(result.type).toBe(mockOrderResponse.type);
      expect(result.side).toBe(mockOrderResponse.side);
      expect(result.status).toBe(mockOrderResponse.status);
      expect(result.qtyUnits).toBe(mockOrderResponse.qtyUnits);
      expect(result.filledQtyUnits).toBe(mockOrderResponse.filledQtyUnits);
      expect(result.price).toBe(mockOrderResponse.price);
      expect(result.volume).toBe(mockOrderResponse.volume);
      expect(result.comment).toBe(mockOrderResponse.comment);

      expect(result.ownedPortfolio).toEqual(mockPortfolio);
      expect(result.targetInstrument).toEqual({
        exchange: mockOrderResponse.exchange,
        symbol: mockOrderResponse.symbol,
        instrumentGroup: mockOrderResponse.board
      });
      expect(result.transTime).toEqual(mockOrderResponse.transTime);
      expect(result.endTime).toEqual(mockOrderResponse.endTime);
    });

    it('should handle undefined endTime', () => {
      const responseWithUndefinedEndTime = { ...mockOrderResponse, endTime: undefined };
      const result = PortfolioItemsModelHelper.orderResponseToModel(responseWithUndefinedEndTime, mockPortfolio);
      expect(result.endTime).toBeUndefined();
    });
  });

  describe('stopOrderResponseToModel', () => {
    const mockStopOrderResponse: StopOrderResponse = {
      id: '456',
      symbol: 'GAZP',
      exchange: 'MOEX',
      board: 'TQBR',
      portfolio: 'D12345',
      type: OrderType.StopMarket,
      side: Side.Sell,
      status: 'working',
      qtyUnits: 5,
      qtyBatch: 1,
      qty: 1,
      filledQtyUnits: 0,
      price: 0, // Price might be 0 for stop orders until triggered
      transTime: new Date('2023-07-17T11:00:00Z'),
      endTime: new Date('2023-07-18T11:00:00Z'),
      existing: true,
      volume: 0,
      stopPrice: 200,
      condition: 'More'
    };

    it('should correctly map StopOrderResponse to StopOrder model', () => {
      const result = PortfolioItemsModelHelper.stopOrderResponseToModel(mockStopOrderResponse, mockPortfolio);

      // Check properties from Order
      expect(result.id).toBe(mockStopOrderResponse.id);
      expect(result.type).toBe(mockStopOrderResponse.type);
      expect(result.side).toBe(mockStopOrderResponse.side);
      expect(result.status).toBe(mockStopOrderResponse.status);
      expect(result.ownedPortfolio).toEqual(mockPortfolio);
      expect(result.targetInstrument).toEqual({
        exchange: mockStopOrderResponse.exchange,
        symbol: mockStopOrderResponse.symbol,
        instrumentGroup: mockStopOrderResponse.board
      });
      expect(result.transTime).toEqual(mockStopOrderResponse.transTime);
      expect(result.endTime).toEqual(mockStopOrderResponse.endTime);

      // Check StopOrder specific properties
      expect(result.triggerPrice).toBe(mockStopOrderResponse.stopPrice);
      expect(result.conditionType).toBe(mockStopOrderResponse.condition);
    });
  });

  describe('positionResponseToModel', () => {
    const mockPositionResponse: PositionResponse = {
      symbol: 'LKOH',
      brokerSymbol: 'MOEX:LKOH',
      exchange: 'MOEX',
      portfolio: 'D12345',
      qtyT0: 100,
      qtyT1: 100,
      qtyT2: 100,
      qtyTFuture: 100,
      qtyUnits: 100,
      openUnits: 100,
      lotSize: 1,
      avgPrice: 5000,
      shortName: 'Lukoil',
      qtyT0Batch: 10,
      qtyT1Batch: 10,
      qtyT2Batch: 10,
      qtyTFutureBatch: 10,
      qtyBatch: 10,
      openQtyBatch: 10,
      qty: 10,
      open: 10,
      dailyUnrealisedPl: 0,
      unrealisedPl: 0,
      isCurrency: false,
      volume: 500000,
      currentVolume: 500000
    };

    it('should correctly map PositionResponse to Position model', () => {
      const result = PortfolioItemsModelHelper.positionResponseToModel(mockPositionResponse, mockPortfolio);

      expect(result.brokerSymbol).toBe(mockPositionResponse.brokerSymbol);
      expect(result.qtyT0).toBe(mockPositionResponse.qtyT0);
      expect(result.avgPrice).toBe(mockPositionResponse.avgPrice);
      expect(result.shortName).toBe(mockPositionResponse.shortName);

      expect(result.ownedPortfolio).toEqual(mockPortfolio);
      expect(result.targetInstrument).toEqual({
        exchange: mockPositionResponse.exchange,
        symbol: mockPositionResponse.symbol
      });
    });
  });

  describe('tradeResponseToModel', () => {
    const mockTradeResponse: TradeResponse = {
      id: '789',
      orderNo: 'ord123',
      symbol: 'ROSN',
      shortName: 'Rosneft',
      brokerSymbol: 'MOEX:ROSN',
      exchange: 'MOEX',
      board: 'TQBR',
      side: Side.Buy,
      qtyUnits: 50,
      qtyBatch: 5,
      qty: 5,
      price: 300,
      date: new Date('2023-07-19T12:00:00Z'),
      existing: true,
      volume: 15000
    };

    it('should correctly map TradeResponse to Trade model', () => {
      const result = PortfolioItemsModelHelper.tradeResponseToModel(mockTradeResponse, mockPortfolio);

      expect(result.id).toBe(mockTradeResponse.id);
      expect(result.orderNo).toBe(mockTradeResponse.orderNo);
      expect(result.shortName).toBe(mockTradeResponse.shortName);
      expect(result.brokerSymbol).toBe(mockTradeResponse.brokerSymbol);
      expect(result.side).toBe(mockTradeResponse.side);
      expect(result.qtyUnits).toBe(mockTradeResponse.qtyUnits);
      expect(result.price).toBe(mockTradeResponse.price);
      expect(result.volume).toBe(mockTradeResponse.volume);

      expect(result.ownedPortfolio).toEqual(mockPortfolio);
      expect(result.targetInstrument).toEqual({
        exchange: mockTradeResponse.exchange,
        symbol: mockTradeResponse.symbol,
        instrumentGroup: mockTradeResponse.board
      });
      expect(result.date).toEqual(mockTradeResponse.date);
    });
  });

  describe('repoTradeResponseToModel', () => {
    const mockRepoSpecificFields: RepoSpecificFields = {
      repoRate: 10,
      extRef: 'ref123',
      repoTerm: 1,
      account: 'acc456',
      tradeTypeInfo: 'info',
      value: 20000,
      yield: 0.05
    };
    const mockRepoTradeResponse: RepoTradeResponse = {
      id: '101',
      orderNo: 'ord456',
      symbol: 'REPO',
      shortName: 'Repo Trade',
      brokerSymbol: 'MOEX:REPO',
      exchange: 'MOEX',
      board: 'RPMA',
      side: Side.Sell,
      qtyUnits: 20,
      qtyBatch: 2,
      qty: 2,
      price: 1000,
      date: new Date('2023-07-20T13:00:00Z'),
      existing: true,
      volume: 20000,
      repoSpecificFields: mockRepoSpecificFields
    };

    it('should correctly map RepoTradeResponse to RepoTrade model', () => {
      const result = PortfolioItemsModelHelper.repoTradeResponseToModel(mockRepoTradeResponse, mockPortfolio);

      // Check properties from Trade
      expect(result.id).toBe(mockRepoTradeResponse.id);
      expect(result.orderNo).toBe(mockRepoTradeResponse.orderNo);
      expect(result.shortName).toBe(mockRepoTradeResponse.shortName);
      expect(result.brokerSymbol).toBe(mockRepoTradeResponse.brokerSymbol);
      expect(result.ownedPortfolio).toEqual(mockPortfolio);
      expect(result.targetInstrument).toEqual({
        exchange: mockRepoTradeResponse.exchange,
        symbol: mockRepoTradeResponse.symbol,
        instrumentGroup: mockRepoTradeResponse.board
      });
      expect(result.date).toEqual(mockRepoTradeResponse.date);

      // Check RepoTrade specific properties
      expect(result.repoSpecificFields).toEqual(mockRepoTradeResponse.repoSpecificFields);
    });
  });
});
