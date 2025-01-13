import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { SubmitMarketOrderCommand } from "./submit-market-order-command";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { of } from "rxjs";
import { Side } from "../../../shared/models/enums/side.model";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { NewMarketOrder } from "../../../shared/models/orders/new-order.model";
import {
  OrderDialogParams,
  OrderFormType
} from "../../../shared/models/orders/orders-dialog.model";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { TestingHelpers } from "../../../shared/utils/testing/testing-helpers";
import { ORDER_COMMAND_SERVICE_TOKEN, } from "../../../shared/services/orders/order-command.service";
import { BracketOptions } from './bracket-command';
import { PriceUnits } from "../models/scalper-order-book-settings.model";
import { OrderbookDataRow } from "../../orderbook/models/orderbook-data.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";

describe('SubmitMarketOrderCommand', () => {
  let command: SubmitMarketOrderCommand;

  let orderServiceSpy: any;
  let ordersDialogServiceSpy: any;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj(
      'OrderCommandService',
      [
        'submitMarketOrder',
        'submitStopLimitOrder'
      ]
    );

    ordersDialogServiceSpy = jasmine.createSpyObj('OrdersDialogService', ['openNewOrderDialog']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SubmitMarketOrderCommand,
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
    command = TestBed.inject(SubmitMarketOrderCommand);
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

      orderServiceSpy.submitMarketOrder.and.returnValue(of({}));
      const quantity = TestingHelpers.getRandomInt(1, 100);

      command.execute({
        instrumentKey: testInstrumentKey,
        side: Side.Sell,
        quantity,
        targetPortfolio: portfolioKey.portfolio,
        silent: true,
        orderBook: {
          b: [],
          a: []
        },
        priceStep: 1,
        bracketOptions: null
      });

      tick(10000);
      expect(orderServiceSpy.submitMarketOrder)
        .withContext('Sell')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity,
            instrument: toInstrumentKey(testInstrumentKey)
          } as NewMarketOrder,
          portfolioKey.portfolio
        );

      command.execute({
        instrumentKey: testInstrumentKey,
        side: Side.Buy,
        quantity,
        targetPortfolio: portfolioKey.portfolio,
        silent: false,
        orderBook: {
          b: [],
          a: []
        },
        priceStep: 1,
        bracketOptions: null
      });

      tick(10000);
      expect(ordersDialogServiceSpy.openNewOrderDialog)
        .withContext('Buy')
        .toHaveBeenCalledOnceWith(
          {
            instrumentKey: toInstrumentKey(testInstrumentKey),
            initialValues: {
              orderType: OrderFormType.Market,
              quantity
            }
          } as OrderDialogParams
        );
    })
  );

  it('#execute should create bracket for buy order', fakeAsync(() => {
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

    orderServiceSpy.submitMarketOrder.and.returnValue(of({isSuccess: true}));
    orderServiceSpy.submitStopLimitOrder.and.returnValue(of({}));

    const quantity = TestingHelpers.getRandomInt(1, 100);
    const bestAsk = 201;
    const priceStep = 0.5;

    command.execute(
      {
        instrumentKey: testInstrumentKey,
        side: Side.Buy,
        quantity,
        targetPortfolio: portfolioKey.portfolio,
        bracketOptions,
        priceStep,
        orderBook: {
          a: [{p: bestAsk} as OrderbookDataRow],
          b: []
        },
        silent: true
      }
    );

    tick(10000);

    const expectedMarketOrder = {
      side: Side.Buy,
      quantity,
      instrument: toInstrumentKey(testInstrumentKey)
    };

    expect(orderServiceSpy.submitMarketOrder)
      .toHaveBeenCalledOnceWith(
        expectedMarketOrder,
        portfolioKey.portfolio
      );

    expect(orderServiceSpy.submitStopLimitOrder).toHaveBeenCalledTimes(2);

    expect(orderServiceSpy.submitStopLimitOrder.calls.argsFor(0)[0])
      .toEqual(jasmine.objectContaining(
          {
            triggerPrice: bracketOptions.profitPriceRatio! * priceStep + bestAsk,
            condition: LessMore.MoreOrEqual,
            side: Side.Sell,
            quantity
          }
        )
      );

    expect(orderServiceSpy.submitStopLimitOrder.calls.argsFor(1)[0])
      .toEqual(jasmine.objectContaining(
          {
            triggerPrice: bestAsk - bracketOptions.lossPriceRatio! * priceStep,
            condition: LessMore.LessOrEqual,
            side: Side.Sell,
            quantity
          }
        )
      );
  }));

  it('#execute should create bracket for ask order', fakeAsync(() => {
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

    orderServiceSpy.submitMarketOrder.and.returnValue(of({isSuccess: true}));
    orderServiceSpy.submitStopLimitOrder.and.returnValue(of({}));

    const quantity = TestingHelpers.getRandomInt(1, 100);
    const bestBid = 100;
    const priceStep = 0.5;

    command.execute(
      {
        instrumentKey: testInstrumentKey,
        side: Side.Sell,
        quantity,
        targetPortfolio: portfolioKey.portfolio,
        bracketOptions,
        priceStep,
        orderBook: {
          a: [],
          b: [{p: bestBid} as OrderbookDataRow]
        },
        silent: true
      }
    );

    tick(10000);

    const expectedMarketOrder = {
      side: Side.Sell,
      quantity,
      instrument: toInstrumentKey(testInstrumentKey)
    };

    expect(orderServiceSpy.submitMarketOrder)
      .toHaveBeenCalledOnceWith(
        expectedMarketOrder,
        portfolioKey.portfolio
      );

    expect(orderServiceSpy.submitStopLimitOrder).toHaveBeenCalledTimes(2);

    expect(orderServiceSpy.submitStopLimitOrder.calls.argsFor(0)[0])
      .toEqual(jasmine.objectContaining(
          {
            triggerPrice: bestBid - bracketOptions.profitPriceRatio! * priceStep,
            condition: LessMore.LessOrEqual,
            side: Side.Buy,
            quantity
          }
        )
      );

    expect(orderServiceSpy.submitStopLimitOrder.calls.argsFor(1)[0])
      .toEqual(jasmine.objectContaining(
          {
            triggerPrice: bestBid + bracketOptions.lossPriceRatio! * priceStep,
            condition: LessMore.MoreOrEqual,
            side: Side.Buy,
            quantity
          }
        )
      );
  }));
});
