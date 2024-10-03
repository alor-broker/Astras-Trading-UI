import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { SubmitMarketOrderCommand } from "./submit-market-order-command";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import {
  generateRandomString,
  getRandomInt
} from "../../../shared/utils/testing";
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
import { OrdersGroupService } from "../../../shared/services/orders/orders-group.service";
import { BracketOptions } from "./bracket-command";
import { PriceUnits } from "../models/scalper-order-book-settings.model";
import { OrderType } from "../../../shared/models/orders/order.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { MathHelper } from "../../../shared/utils/math-helper";
import { ExecutionPolicy } from "../../../shared/models/orders/orders-group.model";
import { OrderbookDataRow } from "../../orderbook/models/orderbook-data.model";

describe('SubmitMarketOrderCommand', () => {
  let command: SubmitMarketOrderCommand;

  let orderServiceSpy: any;
  let ordersDialogServiceSpy: any;
  let ordersGroupServiceSpy: any;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj('WsOrdersService', ['submitMarketOrder']);
    ordersDialogServiceSpy = jasmine.createSpyObj('OrdersDialogService', ['openNewOrderDialog']);
    ordersGroupServiceSpy = jasmine.createSpyObj('OrdersGroupService', ['submitOrdersGroup']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WsOrdersService,
          useValue: orderServiceSpy
        },
        {
          provide: OrdersDialogService,
          useValue: ordersDialogServiceSpy
        },
        {
          provide: OrdersGroupService,
          useValue: ordersGroupServiceSpy
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
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
      };

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4)
      };

      orderServiceSpy.submitMarketOrder.and.returnValue(of({}));
      const quantity = getRandomInt(1, 100);

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

  it('#execute should create bracket', fakeAsync(() => {
    const portfolioKey: PortfolioKey = {
      exchange: generateRandomString(4),
      portfolio: generateRandomString(5),
    };

    const testInstrumentKey: InstrumentKey = {
      exchange: portfolioKey.exchange,
      symbol: generateRandomString(4)
    };

    const bracketOptions: BracketOptions = {
      profitPriceRatio: 1,
      lossPriceRatio: 2,
      orderPriceUnits: PriceUnits.Points,
      currentPosition: null,
      applyBracketOnClosing: false
    };

    ordersGroupServiceSpy.submitOrdersGroup.and.returnValue(of({}));
    const quantity = getRandomInt(1, 100);
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

    expect(ordersGroupServiceSpy.submitOrdersGroup).toHaveBeenCalledOnceWith(
      [
        jasmine.objectContaining(
          {
            ...expectedMarketOrder,
            type: OrderType.Market
          }),
        {
          ...expectedMarketOrder,
          price: bestAsk,
          type: OrderType.StopLimit,
          condition: LessMore.MoreOrEqual,
          triggerPrice: MathHelper.roundPrice(bestAsk + (bracketOptions.profitPriceRatio! * priceStep), priceStep),
          side: Side.Sell,
          activate: false
        },
        {
          ...expectedMarketOrder,
          price: bestAsk,
          type: OrderType.StopLimit,
          condition: LessMore.LessOrEqual,
          triggerPrice: MathHelper.roundPrice(bestAsk - (bracketOptions.lossPriceRatio! * priceStep), priceStep),
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
      exchange: generateRandomString(4),
      portfolio: generateRandomString(5),
    };

    const testInstrumentKey: InstrumentKey = {
      exchange: portfolioKey.exchange,
      symbol: generateRandomString(4)
    };

    const priceStep = 0.5;

    const bracketOptions: BracketOptions = {
      profitPriceRatio: 1,
      lossPriceRatio: null,
      orderPriceUnits: PriceUnits.Percents,
      currentPosition: null,
      applyBracketOnClosing: false
    };

    ordersGroupServiceSpy.submitOrdersGroup.and.returnValue(of({}));
    const quantity = getRandomInt(1, 100);
    const bestAsk = 201;

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

    expect(ordersGroupServiceSpy.submitOrdersGroup).toHaveBeenCalledOnceWith(
      [
        jasmine.objectContaining({
          ...expectedMarketOrder,
          type: OrderType.Market
        }),
        {
          ...expectedMarketOrder,
          price: bestAsk,
          type: OrderType.StopLimit,
          condition: LessMore.MoreOrEqual,
          triggerPrice: MathHelper.roundPrice((1 + bracketOptions.profitPriceRatio! * 0.01) * bestAsk, priceStep),
          side: Side.Sell,
          activate: false
        }
      ],
      portfolioKey.portfolio,
      ExecutionPolicy.TriggerBracketOrders
    );
  }));
});
