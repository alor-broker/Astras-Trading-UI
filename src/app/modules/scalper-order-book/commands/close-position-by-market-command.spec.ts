import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { ClosePositionByMarketCommand } from "./close-position-by-market-command";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Position } from "../../../shared/models/positions/position.model";
import { of } from "rxjs";
import { Side } from "../../../shared/models/enums/side.model";
import { NewMarketOrder } from "../../../shared/models/orders/new-order.model";
import { TestingHelpers } from 'src/app/shared/utils/testing/testing-helpers';

describe('ClosePositionByMarketCommand', () => {
  let command: ClosePositionByMarketCommand;

  let orderServiceSpy: any;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj('WsOrdersService', ['submitMarketOrder']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WsOrdersService,
          useValue: orderServiceSpy
        },
      ]
    });
    command = TestBed.inject(ClosePositionByMarketCommand);
  });

  it('should be created', () => {
    expect(command).toBeTruthy();
  });

  it('#execute should call service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: TestingHelpers.generateRandomString(4),
        portfolio: TestingHelpers.generateRandomString(5),
      };

      const testInstrumentKey1: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: TestingHelpers.generateRandomString(4),
        instrumentGroup: TestingHelpers.generateRandomString(4),
      };

      const testInstrumentKey2: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: TestingHelpers.generateRandomString(4),
        instrumentGroup: TestingHelpers.generateRandomString(4),
      };

      const position1 = {
        symbol: testInstrumentKey1.symbol,
        exchange: testInstrumentKey1.exchange,
        portfolio: portfolioKey.portfolio,
        qtyTFuture: TestingHelpers.getRandomInt(1, 100),
        qtyTFutureBatch: TestingHelpers.getRandomInt(1, 10)
      } as Position;

      const position2 = {
        symbol: testInstrumentKey2.symbol,
        exchange: testInstrumentKey1.exchange,
        portfolio: portfolioKey.portfolio,
        qtyTFuture: TestingHelpers.getRandomInt(1, 100) * -1,
        qtyTFutureBatch: TestingHelpers.getRandomInt(1, 10) * -1
      } as Position;

      orderServiceSpy.submitMarketOrder.and.returnValue(of({}));

      command.execute({
        currentPosition: position1,
        targetInstrumentBoard: testInstrumentKey1.instrumentGroup ?? null
      });

      tick(10000);

      expect(orderServiceSpy.submitMarketOrder).toHaveBeenCalledOnceWith(
        {
          side: Side.Sell,
          quantity: position1.qtyTFutureBatch,
          instrument: testInstrumentKey1
        } as NewMarketOrder,
        portfolioKey.portfolio
      );

      orderServiceSpy.submitMarketOrder.calls.reset();
      command.execute({
        currentPosition: position2,
        targetInstrumentBoard: testInstrumentKey2.instrumentGroup ?? null
      });

      tick(10000);

      expect(orderServiceSpy.submitMarketOrder).toHaveBeenCalledOnceWith(
        {
          side: Side.Buy,
          quantity: Math.abs(position2.qtyTFutureBatch),
          instrument: testInstrumentKey2
        } as NewMarketOrder,
        portfolioKey.portfolio
      );
    })
  );
});
