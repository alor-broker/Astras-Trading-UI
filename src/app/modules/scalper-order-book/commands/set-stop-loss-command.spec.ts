import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { SetStopLossCommand } from "./set-stop-loss-command";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Position } from "../../../shared/models/positions/position.model";
import { of } from "rxjs";
import { Side } from "../../../shared/models/enums/side.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { NewStopMarketOrder } from "../../../shared/models/orders/new-order.model";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { ScalperOrderBookInstantTranslatableNotificationsService } from "../services/scalper-order-book-instant-translatable-notifications.service";
import { TestingHelpers } from "../../../shared/utils/testing/testing-helpers";
import { OrderCommandService } from "../../../shared/services/orders/order-command.service";

describe('SetStopLossCommand', () => {
  let command: SetStopLossCommand;

  let orderServiceSpy: any;
  let ordersDialogServiceSpy: any;
  let notificationsServiceSpy: any;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj('OrderCommandService', ['submitStopMarketOrder']);
    ordersDialogServiceSpy = jasmine.createSpyObj('OrdersDialogService', ['openNewOrderDialog']);
    notificationsServiceSpy = jasmine.createSpyObj('ScalperOrderBookInstantTranslatableNotificationsService', ['emptyPositions']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: OrderCommandService,
          useValue: orderServiceSpy
        },
        {
          provide: OrdersDialogService,
          useValue: ordersDialogServiceSpy
        },
        {
          provide: ScalperOrderBookInstantTranslatableNotificationsService,
          useValue: notificationsServiceSpy
        },
      ]
    });
    command = TestBed.inject(SetStopLossCommand);
  });

  it('should be created', () => {
    expect(command).toBeTruthy();
  });

  it('#execute should notify if no positions', fakeAsync(() => {
    const portfolioKey: PortfolioKey = {
      exchange: TestingHelpers.generateRandomString(4),
      portfolio: TestingHelpers.generateRandomString(5),
    };

    const testInstrumentKey: InstrumentKey = {
      exchange: portfolioKey.exchange,
      symbol: TestingHelpers.generateRandomString(4),
      instrumentGroup: TestingHelpers.generateRandomString(4)
    };

    const currentPortfolioPosition: Position =
      {
        symbol: testInstrumentKey.symbol,
        qtyTFutureBatch: 0
      } as Position;

    command.execute({
      currentPosition: currentPortfolioPosition,
      targetInstrumentBoard: testInstrumentKey.instrumentGroup ?? null,
      triggerPrice: TestingHelpers.getRandomInt(1, 1000),
      silent: Math.random() < 0.5
    });

    tick(10000);
    expect(orderServiceSpy.submitStopMarketOrder).not.toHaveBeenCalled();
    expect(ordersDialogServiceSpy.openNewOrderDialog).not.toHaveBeenCalled();
    expect(notificationsServiceSpy.emptyPositions).toHaveBeenCalledTimes(1);
  }));

  it('#execute should call appropriate service with appropriate data', fakeAsync(() => {
      const exchange = TestingHelpers.generateRandomString(4);
      const portfolio = TestingHelpers.generateRandomString(5);

      const testInstrumentKey: InstrumentKey = {
        exchange: exchange,
        symbol: TestingHelpers.generateRandomString(4),
        instrumentGroup: TestingHelpers.generateRandomString(4)
      };

      const avgPrice = 100;
      let expectedPrice = avgPrice - 1;
      const position: Position =
        {
          symbol: testInstrumentKey.symbol,
          exchange: testInstrumentKey.exchange,
          portfolio,
          qtyTFuture: 10,
          qtyTFutureBatch: 1,
          avgPrice: 100
        } as Position;

      orderServiceSpy.submitStopMarketOrder.and.returnValue(of({}));

      command.execute({
        currentPosition: position,
        targetInstrumentBoard: testInstrumentKey.instrumentGroup ?? null,
        triggerPrice: expectedPrice,
        silent: true
      });

      tick(10000);
      expect(orderServiceSpy.submitStopMarketOrder).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          side: Side.Sell,
          quantity: position.qtyTFutureBatch,
          triggerPrice: expectedPrice,
          condition: LessMore.LessOrEqual,
          instrument: testInstrumentKey,
        } as NewStopMarketOrder),
        portfolio
      );

      orderServiceSpy.submitStopMarketOrder.calls.reset();
      expectedPrice = avgPrice + 1;
      position.qtyTFutureBatch = -1;

      command.execute({
        currentPosition: position,
        targetInstrumentBoard: testInstrumentKey.instrumentGroup ?? null,
        triggerPrice: expectedPrice,
        silent: true
      });

      tick(10000);
      expect(orderServiceSpy.submitStopMarketOrder).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          side: Side.Buy,
          quantity: Math.abs(position.qtyTFutureBatch),
          triggerPrice: expectedPrice,
          condition: LessMore.MoreOrEqual,
          instrument: testInstrumentKey
        } as NewStopMarketOrder),
        portfolio
      );
    })
  );
});
