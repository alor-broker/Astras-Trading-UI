import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { ReversePositionByMarketCommand } from "./reverse-position-by-market-command";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import {
  generateRandomString,
  getRandomInt
} from "../../../shared/utils/testing";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Position } from "../../../shared/models/positions/position.model";
import { of } from "rxjs";
import { Side } from "../../../shared/models/enums/side.model";
import { NewMarketOrder } from "../../../shared/models/orders/new-order.model";

describe('ReversePositionByMarketCommand', () => {
  let command: ReversePositionByMarketCommand;
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
    command = TestBed.inject(ReversePositionByMarketCommand);
  });

  it('should be created', () => {
    expect(command).toBeTruthy();
  });

  it('#execute should call service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
      };

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4),
        instrumentGroup: generateRandomString(4)
      };

      const position = {
        symbol: testInstrumentKey.symbol,
        exchange: testInstrumentKey.exchange,
        qtyTFuture: getRandomInt(1, 100),
        qtyTFutureBatch: getRandomInt(1, 10),
        portfolio: portfolioKey.portfolio
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
