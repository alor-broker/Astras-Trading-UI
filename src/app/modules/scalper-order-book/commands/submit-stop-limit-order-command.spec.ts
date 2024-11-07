import {
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick
} from '@angular/core/testing';
import { SubmitStopLimitOrderCommand } from "./submit-stop-limit-order-command";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { of } from "rxjs";
import { Side } from "../../../shared/models/enums/side.model";
import { MathHelper } from "../../../shared/utils/math-helper";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { NewStopLimitOrder } from "../../../shared/models/orders/new-order.model";
import {
  OrderDialogParams,
  OrderFormType
} from "../../../shared/models/orders/orders-dialog.model";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { TestingHelpers } from "../../../shared/utils/testing/testing-helpers";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
} from "../../../shared/services/orders/order-command.service";

describe('SubmitStopLimitOrderCommand', () => {
  let command: SubmitStopLimitOrderCommand;

  let orderServiceSpy: any;
  let ordersDialogServiceSpy: any;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj('OrderCommandService', ['submitStopLimitOrder']);
    ordersDialogServiceSpy = jasmine.createSpyObj('OrdersDialogService', ['openNewOrderDialog']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SubmitStopLimitOrderCommand,
        {
          provide: ORDER_COMMAND_SERVICE_TOKEN,
          useValue: orderServiceSpy
        },
        {
          provide: OrdersDialogService,
          useValue: ordersDialogServiceSpy
        },
      ]
    });
    command = TestBed.inject(SubmitStopLimitOrderCommand);
  });

  it('should be created', () => {
    expect(command).toBeTruthy();
  });

  it('#execute should call appropriate service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: TestingHelpers.generateRandomString(4),
        portfolio: TestingHelpers.generateRandomString(5),
      };

      flushMicrotasks();

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: TestingHelpers.generateRandomString(4)
      };

      const minstep = 0.5;

      orderServiceSpy.submitStopLimitOrder.and.returnValue(of({}));

      const quantity = TestingHelpers.getRandomInt(1, 100);
      const price = TestingHelpers.getRandomInt(1, 1000);
      const distance = 7;

      command.execute({
        instrumentKey: testInstrumentKey,
        side: Side.Sell,
        quantity,
        triggerPrice: price,
        priceOptions: {
          distance,
          priceStep: minstep
        },
        targetPortfolio: portfolioKey.portfolio,
        silent: true
      });

      tick(10000);
      expect(orderServiceSpy.submitStopLimitOrder)
        .withContext('Sell. Silent')
        .toHaveBeenCalledOnceWith(
          jasmine.objectContaining({
            side: Side.Sell,
            quantity: quantity,
            price: MathHelper.roundPrice(price - distance * minstep, minstep),
            instrument: toInstrumentKey(testInstrumentKey),
            triggerPrice: price,
            condition: LessMore.LessOrEqual
          } as NewStopLimitOrder),
          portfolioKey.portfolio
        );

      orderServiceSpy.submitStopLimitOrder.calls.reset();

      command.execute({
        instrumentKey: testInstrumentKey,
        side: Side.Buy,
        quantity,
        triggerPrice: price,
        priceOptions: {
          distance,
          priceStep: minstep
        },
        targetPortfolio: portfolioKey.portfolio,
        silent: true
      });

      tick(10000);
      expect(orderServiceSpy.submitStopLimitOrder)
        .withContext('Buy. Silent')
        .toHaveBeenCalledOnceWith(
          jasmine.objectContaining({
            side: Side.Buy,
            quantity: quantity,
            price: MathHelper.roundPrice(price + distance * minstep, minstep),
            instrument: toInstrumentKey(testInstrumentKey),
            triggerPrice: price,
            condition: LessMore.MoreOrEqual
          } as NewStopLimitOrder),
          portfolioKey.portfolio
        );

      command.execute({
        instrumentKey: testInstrumentKey,
        side: Side.Buy,
        quantity,
        triggerPrice: price,
        priceOptions: {
          distance,
          priceStep: minstep
        },
        targetPortfolio: portfolioKey.portfolio,
        silent: false
      });

      tick(10000);
      expect(ordersDialogServiceSpy.openNewOrderDialog)
        .withContext('Show dialog')
        .toHaveBeenCalledOnceWith(jasmine.objectContaining({
            instrumentKey: toInstrumentKey(testInstrumentKey),
            initialValues: {
              orderType: OrderFormType.Stop,
              quantity,
              price: MathHelper.roundPrice(price + distance * minstep, minstep),
              stopOrder: {
                triggerPrice: price,
                condition: LessMore.MoreOrEqual,
                limit: true,
                disableCalculations: true
              }
            }
          } as OrderDialogParams)
        );
    })
  );
});
