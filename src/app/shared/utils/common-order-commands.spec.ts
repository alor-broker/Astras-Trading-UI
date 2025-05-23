import { CommonOrderCommands } from './common-order-commands';
import { Position } from '../models/positions/position.model';
import { Side } from '../models/enums/side.model';
import { OrderCommandService } from '../services/orders/order-command.service';
import { of } from 'rxjs';
import { Instrument } from '../models/instruments/instrument.model';
import { PortfolioKey } from '../models/portfolio-key.model';

describe('CommonOrderCommands', () => {
  let orderCommandServiceSpy: jasmine.SpyObj<OrderCommandService>;

  beforeEach(() => {
    orderCommandServiceSpy = jasmine.createSpyObj('OrderCommandService', ['submitMarketOrder']);
    orderCommandServiceSpy.submitMarketOrder.and.returnValue(of({} as any));
  });

  describe('closePositionByMarket', () => {
    const mockPositionBase = {
      qtyTFutureBatch: 10,
      targetInstrument: {
        symbol: 'SBER',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR'
      } as Instrument,
      ownedPortfolio: {
        portfolio: 'D12345',
        exchange: 'MOEX'
      } as PortfolioKey
    } as unknown as Position;
    const targetInstrumentBoard = 'TQBR';

    it('should not call submitMarketOrder if qtyTFutureBatch is 0', () => {
      const position: Position = { ...mockPositionBase, qtyTFutureBatch: 0 };
      CommonOrderCommands.closePositionByMarket(position, targetInstrumentBoard, orderCommandServiceSpy);
      expect(orderCommandServiceSpy.submitMarketOrder).not.toHaveBeenCalled();
    });

    it('should call submitMarketOrder with Side.Sell for positive qtyTFutureBatch', () => {
      const position: Position = { ...mockPositionBase, qtyTFutureBatch: 10 };
      CommonOrderCommands.closePositionByMarket(position, targetInstrumentBoard, orderCommandServiceSpy);
      expect(orderCommandServiceSpy.submitMarketOrder).toHaveBeenCalledWith(
        jasmine.objectContaining({
          side: Side.Sell,
          quantity: 10,
          instrument: {
            ...position.targetInstrument,
            instrumentGroup: targetInstrumentBoard
          }
        }),
        position.ownedPortfolio.portfolio
      );
    });

    it('should call submitMarketOrder with Side.Buy for negative qtyTFutureBatch', () => {
      const position: Position = { ...mockPositionBase, qtyTFutureBatch: -5 };
      CommonOrderCommands.closePositionByMarket(position, targetInstrumentBoard, orderCommandServiceSpy);
      expect(orderCommandServiceSpy.submitMarketOrder).toHaveBeenCalledWith(
        jasmine.objectContaining({
          side: Side.Buy,
          quantity: 5,
          instrument: {
            ...position.targetInstrument,
            instrumentGroup: targetInstrumentBoard
          }
        }),
        position.ownedPortfolio.portfolio
      );
    });

    it('should use null for targetInstrumentBoard if provided as null', () => {
      const position: Position = { ...mockPositionBase, qtyTFutureBatch: 10 };
      CommonOrderCommands.closePositionByMarket(position, null, orderCommandServiceSpy);
      expect(orderCommandServiceSpy.submitMarketOrder).toHaveBeenCalledWith(
        jasmine.objectContaining({
          instrument: {
            ...position.targetInstrument,
            instrumentGroup: null
          }
        }),
        position.ownedPortfolio.portfolio
      );
    });
  });

  describe('reversePositionsByMarket', () => {
    const mockPositionBase = {
      qtyTFutureBatch: 20,
      targetInstrument: {
        symbol: 'GAZP',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR'
      } as Instrument,
      ownedPortfolio: {
        portfolio: 'P00001',
        exchange: 'MOEX'
      } as PortfolioKey
    } as unknown as Position;
    const targetInstrumentBoard = 'TQBR';

    it('should not call submitMarketOrder if qtyTFutureBatch is 0', () => {
      const position: Position = { ...mockPositionBase, qtyTFutureBatch: 0 };
      CommonOrderCommands.reversePositionsByMarket(position, targetInstrumentBoard, orderCommandServiceSpy);
      expect(orderCommandServiceSpy.submitMarketOrder).not.toHaveBeenCalled();
    });

    it('should call submitMarketOrder with Side.Sell and double quantity for positive qtyTFutureBatch', () => {
      const position: Position = { ...mockPositionBase, qtyTFutureBatch: 15 };
      CommonOrderCommands.reversePositionsByMarket(position, targetInstrumentBoard, orderCommandServiceSpy);
      expect(orderCommandServiceSpy.submitMarketOrder).toHaveBeenCalledWith(
        jasmine.objectContaining({
          side: Side.Sell,
          quantity: 30, // 15 * 2
          instrument: {
            ...position.targetInstrument,
            instrumentGroup: targetInstrumentBoard
          },
          allowMargin: undefined
        }),
        position.ownedPortfolio.portfolio
      );
    });

    it('should call submitMarketOrder with Side.Buy and double quantity for negative qtyTFutureBatch', () => {
      const position = { ...mockPositionBase, qtyTFutureBatch: -8 };
      CommonOrderCommands.reversePositionsByMarket(position, targetInstrumentBoard, orderCommandServiceSpy);
      expect(orderCommandServiceSpy.submitMarketOrder).toHaveBeenCalledWith(
        jasmine.objectContaining({
          side: Side.Buy,
          quantity: 16, // |-8| * 2
          instrument: {
            ...position.targetInstrument,
            instrumentGroup: targetInstrumentBoard
          },
          allowMargin: undefined
        }),
        position.ownedPortfolio.portfolio
      );
    });

    it('should pass allowMargin if provided', () => {
      const position: Position = { ...mockPositionBase, qtyTFutureBatch: 10 };
      CommonOrderCommands.reversePositionsByMarket(position, targetInstrumentBoard, orderCommandServiceSpy, true);
      expect(orderCommandServiceSpy.submitMarketOrder).toHaveBeenCalledWith(
        jasmine.objectContaining({
          allowMargin: true
        }),
        position.ownedPortfolio.portfolio
      );

      CommonOrderCommands.reversePositionsByMarket(position, targetInstrumentBoard, orderCommandServiceSpy, false);
      expect(orderCommandServiceSpy.submitMarketOrder).toHaveBeenCalledWith(
        jasmine.objectContaining({
          allowMargin: false
        }),
        position.ownedPortfolio.portfolio
      );
    });

    it('should use null for targetInstrumentBoard if provided as null', () => {
      const position: Position = { ...mockPositionBase, qtyTFutureBatch: 10 } as Position;
      CommonOrderCommands.reversePositionsByMarket(position, null, orderCommandServiceSpy);
      expect(orderCommandServiceSpy.submitMarketOrder).toHaveBeenCalledWith(
        jasmine.objectContaining({
          instrument: {
            ...position.targetInstrument,
            instrumentGroup: null
          }
        }),
        position.ownedPortfolio.portfolio
      );
    });
  });
});
