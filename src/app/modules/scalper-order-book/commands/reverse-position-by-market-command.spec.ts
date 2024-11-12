import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { ReversePositionByMarketCommand } from "./reverse-position-by-market-command";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Position } from "../../../shared/models/positions/position.model";
import { of } from "rxjs";
import { Side } from "../../../shared/models/enums/side.model";
import { NewMarketOrder } from "../../../shared/models/orders/new-order.model";
import { TestingHelpers } from 'src/app/shared/utils/testing/testing-helpers';
import {
  ORDER_COMMAND_SERVICE_TOKEN,
} from "../../../shared/services/orders/order-command.service";

describe('ReversePositionByMarketCommand', () => {
  let command: ReversePositionByMarketCommand;
  let orderServiceSpy: any;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj('OrderCommandService', ['submitMarketOrder']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReversePositionByMarketCommand,
        {
          provide: ORDER_COMMAND_SERVICE_TOKEN,
          useValue: orderServiceSpy
        },
      ]
    });
    command = TestBed.inject(ReversePositionByMarketCommand);
  });

  it('should be created', () => {
    expect(command).toBeTruthy();
  });

  it('#execute should call service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: TestingHelpers.generateRandomString(4),
        portfolio: TestingHelpers.generateRandomString(5),
      };

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: TestingHelpers.generateRandomString(4),
        instrumentGroup: TestingHelpers.generateRandomString(4)
      };

      const position = {
        targetInstrument: testInstrumentKey,
        ownedPortfolio: portfolioKey,
        qtyTFuture: TestingHelpers.getRandomInt(1, 100),
        qtyTFutureBatch: TestingHelpers.getRandomInt(1, 10),
      } as Position;

      orderServiceSpy.submitMarketOrder.and.returnValue(of({}));

      command.execute({
        currentPosition: position,
        targetInstrumentBoard: testInstrumentKey.instrumentGroup!
      });

      tick(10000);
      expect(orderServiceSpy.submitMarketOrder)
        .withContext('qtyTFutureBatch > 0')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity: position.qtyTFutureBatch * 2,
            instrument: testInstrumentKey
          } as NewMarketOrder,
          portfolioKey.portfolio
        );

      orderServiceSpy.submitMarketOrder.calls.reset();
      position.qtyTFutureBatch = position.qtyTFutureBatch * -1;

      command.execute({
        currentPosition: position,
        targetInstrumentBoard: testInstrumentKey.instrumentGroup!
      });

      tick(10000);
      expect(orderServiceSpy.submitMarketOrder)
        .withContext('qtyTFutureBatch < 0')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            quantity: Math.abs(position.qtyTFutureBatch) * 2,
            instrument: testInstrumentKey
          } as NewMarketOrder,
          portfolioKey.portfolio
        );
    })
  );
});
