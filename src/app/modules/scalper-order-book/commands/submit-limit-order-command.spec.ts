import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import {
  BracketOptions,
  SubmitLimitOrderCommand
} from "./submit-limit-order-command";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { of } from "rxjs";
import { Side } from "../../../shared/models/enums/side.model";
import { NewLimitOrder } from "../../../shared/models/orders/new-order.model";
import {
  OrderDialogParams,
  OrderFormType
} from "../../../shared/models/orders/orders-dialog.model";
import { OrderType } from "../../../shared/models/orders/order.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { MathHelper } from "../../../shared/utils/math-helper";
import { ExecutionPolicy } from "../../../shared/models/orders/orders-group.model";
import { PriceUnits } from "../models/scalper-order-book-settings.model";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { TestingHelpers } from "../../../shared/utils/testing/testing-helpers";
import { OrderCommandService } from "../../../shared/services/orders/order-command.service";

describe('SubmitLimitOrderCommand', () => {
  let command: SubmitLimitOrderCommand;

  let orderServiceSpy: any;
  let ordersDialogServiceSpy: any;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj('OrderCommandService', ['submitLimitOrder', 'submitOrdersGroup']);
    ordersDialogServiceSpy = jasmine.createSpyObj('OrdersDialogService', ['openNewOrderDialog']);
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
        }
      ]
    });
    command = TestBed.inject(SubmitLimitOrderCommand);
  });

  it('should be created', () => {
    expect(command).toBeTruthy();
  });

  it('#execute should call appropriate service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: TestingHelpers.generateRandomString(4),
        portfolio: TestingHelpers.generateRandomString(5),
      };

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: TestingHelpers.generateRandomString(4)
      };

      orderServiceSpy.submitLimitOrder.and.returnValue(of({}));

      const quantity = TestingHelpers.getRandomInt(1, 100);
      const price = TestingHelpers.getRandomInt(1, 1000);

      command.execute(
        {
          instrumentKey: testInstrumentKey,
          side: Side.Sell,
          quantity,
          price,
          targetPortfolio: portfolioKey.portfolio,
          bracketOptions: null,
          priceStep: 0.1,
          silent: true
        }
      );

      tick(10000);
      expect(orderServiceSpy.submitLimitOrder)
        .withContext('Sell')
        .toHaveBeenCalledOnceWith(
          jasmine.objectContaining({
            side: Side.Sell,
            quantity,
            price: price,
            instrument: toInstrumentKey(testInstrumentKey)
          } as NewLimitOrder),
          portfolioKey.portfolio
        );

      command.execute(
        {
          instrumentKey: testInstrumentKey,
          side: Side.Buy,
          quantity,
          price,
          targetPortfolio: portfolioKey.portfolio,
          bracketOptions: null,
          priceStep: 0.1,
          silent: false
        }
      );

      tick(10000);
      expect(ordersDialogServiceSpy.openNewOrderDialog)
        .withContext('Buy')
        .toHaveBeenCalledOnceWith(
          jasmine.objectContaining({
            instrumentKey: toInstrumentKey(testInstrumentKey),
            initialValues: {
              orderType: OrderFormType.Limit,
              quantity,
              price: price,
              bracket: {}
            }
          } as OrderDialogParams)
        );
    })
  );

  it('#execute should create bracket', fakeAsync(() => {
    const portfolioKey: PortfolioKey = {
      exchange: TestingHelpers.generateRandomString(4),
      portfolio: TestingHelpers.generateRandomString(5),
    };

    const testInstrumentKey: InstrumentKey = {
      exchange: portfolioKey.exchange,
      symbol: TestingHelpers.generateRandomString(4)
    };

    const bracketOptions: BracketOptions = {
      profitPriceRatio: 1,
      lossPriceRatio: 2,
      orderPriceUnits: PriceUnits.Points,
      currentPosition: null,
      applyBracketOnClosing: false
    };

    orderServiceSpy.submitOrdersGroup.and.returnValue(of({}));
    const quantity = TestingHelpers.getRandomInt(1, 100);
    const price = TestingHelpers.getRandomInt(1, 1000);
    const priceStep = 0.5;

    command.execute(
      {
        instrumentKey: testInstrumentKey,
        side: Side.Buy,
        quantity,
        price,
        targetPortfolio: portfolioKey.portfolio,
        bracketOptions,
        priceStep,
        silent: true
      }
    );

    tick(10000);

    const expectedLimitOrder = {
      side: Side.Buy,
      quantity,
      price,
      instrument: toInstrumentKey(testInstrumentKey)
    };

    expect(orderServiceSpy.submitOrdersGroup).toHaveBeenCalledOnceWith(
      [
        jasmine.objectContaining(
          {
            ...expectedLimitOrder,
            type: OrderType.Limit
          }),
        {
          ...expectedLimitOrder,
          type: OrderType.StopLimit,
          condition: LessMore.MoreOrEqual,
          triggerPrice: MathHelper.roundPrice(price + (bracketOptions.profitPriceRatio! * priceStep), priceStep),
          side: Side.Sell,
          activate: false
        },
        {
          ...expectedLimitOrder,
          type: OrderType.StopLimit,
          condition: LessMore.LessOrEqual,
          triggerPrice: MathHelper.roundPrice(price - (bracketOptions.lossPriceRatio! * priceStep), priceStep),
          side: Side.Sell,
          activate: false
        },
      ],
      portfolioKey.portfolio,
      ExecutionPolicy.TriggerBracketOrders
    );
  }));

  it('#execute should create bracket with percent price ratio settings', fakeAsync(() => {
    const portfolioKey: PortfolioKey = {
      exchange: TestingHelpers.generateRandomString(4),
      portfolio: TestingHelpers.generateRandomString(5),
    };

    const testInstrumentKey: InstrumentKey = {
      exchange: portfolioKey.exchange,
      symbol: TestingHelpers.generateRandomString(4)
    };

    const priceStep = 0.5;

    const bracketOptions: BracketOptions = {
      profitPriceRatio: 1,
      lossPriceRatio: null,
      orderPriceUnits: PriceUnits.Percents,
      currentPosition: null,
      applyBracketOnClosing: false
    };

    orderServiceSpy.submitOrdersGroup.and.returnValue(of({}));
    const quantity = TestingHelpers.getRandomInt(1, 100);
    const price = TestingHelpers.getRandomInt(1, 1000);

    command.execute(
      {
        instrumentKey: testInstrumentKey,
        side: Side.Buy,
        quantity,
        price,
        targetPortfolio: portfolioKey.portfolio,
        bracketOptions,
        priceStep,
        silent: true
      }
    );

    tick(10000);

    const expectedLimitOrder = {
      side: Side.Buy,
      quantity,
      price,
      instrument: toInstrumentKey(testInstrumentKey)
    };

    expect(orderServiceSpy.submitOrdersGroup).toHaveBeenCalledOnceWith(
      [
        jasmine.objectContaining({
          ...expectedLimitOrder,
          type: OrderType.Limit
        }),
        {
          ...expectedLimitOrder,
          type: OrderType.StopLimit,
          condition: LessMore.MoreOrEqual,
          triggerPrice: MathHelper.roundPrice((1 + bracketOptions.profitPriceRatio! * 0.01) * price, priceStep),
          side: Side.Sell,
          activate: false
        }
      ],
      portfolioKey.portfolio,
      ExecutionPolicy.TriggerBracketOrders
    );
  }));
});
