import {fakeAsync, flushMicrotasks, TestBed, tick} from '@angular/core/testing';

import {ScalperOrdersService} from './scalper-orders.service';
import {
  commonTestProviders,
  generateRandomString,
  getRandomInt,
  sharedModuleImportForTests
} from "../../../shared/utils/testing";
import {OrderCancellerService} from "../../../shared/services/order-canceller.service";
import {OrderService} from "../../../shared/services/orders/order.service";
import {NzNotificationService} from "ng-zorro-antd/notification";
import {of} from "rxjs";
import {Store} from "@ngrx/store";
import {PortfolioKey} from "../../../shared/models/portfolio-key.model";
import {InstrumentKey} from "../../../shared/models/instruments/instrument-key.model";
import {Position} from "../../../shared/models/positions/position.model";
import {Side} from "../../../shared/models/enums/side.model";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {Instrument} from '../../../shared/models/instruments/instrument.model';
import {CancelCommand} from '../../../shared/models/commands/cancel-command.model';
import {CurrentOrderDisplay} from '../models/scalper-order-book.model';
import {OrderbookDataRow} from '../../orderbook/models/orderbook-data.model';
import {LessMore} from "../../../shared/models/enums/less-more.model";
import {PriceUnits, ScalperOrderBookWidgetSettings, VolumeHighlightMode} from "../models/scalper-order-book-settings.model";
import {ExecutionPolicy} from "../../../shared/models/orders/orders-group.model";
import {MathHelper} from "../../../shared/utils/math-helper";
import {OrdersDialogService} from "../../../shared/services/orders/orders-dialog.service";
import {OrderDialogParams, OrderType} from "../../../shared/models/orders/orders-dialog.model";
import {
  NewLimitOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder
} from "../../../shared/models/orders/new-order.model";
import {toInstrumentKey} from "../../../shared/utils/instruments";

describe('ScalperOrdersService', () => {
  let service: ScalperOrdersService;
  let store: Store;

  let orderCancellerServiceSpy: any;
  let orderServiceSpy: any;
  let notificationServiceSpy: any;
  let ordersDialogServiceSpy: any;

  let testSettings: ScalperOrderBookWidgetSettings;

  beforeEach(() => {
    orderCancellerServiceSpy = jasmine.createSpyObj('OrderCancellerService', ['cancelOrder']);

    orderServiceSpy = jasmine.createSpyObj(
      'OrderService',
      [
        'submitMarketOrder',
        'submitLimitOrder',
        'submitStopLimitOrder',
        'submitStopMarketOrder',
        'submitOrdersGroup'
      ]
    );

    notificationServiceSpy = jasmine.createSpyObj('NzNotificationService', ['error', 'warning']);
    ordersDialogServiceSpy = jasmine.createSpyObj('OrdersDialogService', ['openNewOrderDialog', 'openEditOrderDialog']);

    testSettings = {
      guid: generateRandomString(10),
      symbol: 'SBER',
      exchange: 'MOEX',
      enableMouseClickSilentOrders: true,
      disableHotkeys: false,
      volumeHighlightFullness: 1000,
      volumeHighlightMode: VolumeHighlightMode.BiggestVolume,
      showSpreadItems: false,
      showZeroVolumeItems: false,
      volumeHighlightOptions: [],
      workingVolumes: []
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        BrowserAnimationsModule
      ],
      providers: [
        ScalperOrdersService,
        { provide: OrderCancellerService, useValue: orderCancellerServiceSpy },
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: NzNotificationService, useValue: notificationServiceSpy },
        { provide: OrdersDialogService, useValue: ordersDialogServiceSpy },
        ...commonTestProviders
      ]
    });

    service = TestBed.inject(ScalperOrdersService);
    store = TestBed.inject(Store);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#cancelOrders should call service with appropriate data', (done => {
        const testOrder: CurrentOrderDisplay = {
          linkedPrice: 10,
          symbol: 'TEST',
          orderId: generateRandomString(5),
          exchange: generateRandomString(4),
          portfolio: generateRandomString(5),
          type: 'limit',
          displayVolume: 10,
          side: Side.Buy
        };

        orderCancellerServiceSpy.cancelOrder.and.callFake((command: CancelCommand) => {
          done();

          expect(command).toEqual({
            orderid: testOrder.orderId,
            exchange: testOrder.exchange,
            portfolio: testOrder.portfolio,
            stop: false
          });

          return of({});
        });

        service.cancelOrders([testOrder]);
      }
    )
  );

  it('#closePositionsByMarket should call service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
      };

      const testInstrumentKey1: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4),
        instrumentGroup: generateRandomString(4),
      };

      const testInstrumentKey2: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4),
        instrumentGroup: generateRandomString(4),
      };

      const position1 = {
        symbol: testInstrumentKey1.symbol,
        exchange: testInstrumentKey1.exchange,
        portfolio: portfolioKey.portfolio,
        qtyTFuture: getRandomInt(1, 100),
        qtyTFutureBatch: getRandomInt(1, 10)
      } as Position;

      const position2 = {
        symbol: testInstrumentKey2.symbol,
        exchange: testInstrumentKey1.exchange,
        portfolio: portfolioKey.portfolio,
        qtyTFuture: getRandomInt(1, 100) * -1,
        qtyTFutureBatch: getRandomInt(1, 10) * -1
      } as Position;

      orderServiceSpy.submitMarketOrder.and.returnValue(of({}));

      service.closePositionsByMarket(position1, testInstrumentKey1.instrumentGroup ?? null);
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
      service.closePositionsByMarket(position2, testInstrumentKey2.instrumentGroup ?? null);
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

  it('#placeBestOrder should call service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
      };

      const symbol = generateRandomString(4);
      const testInstrument: Instrument = {
        exchange: portfolioKey.exchange,
        symbol: symbol,
        shortName: symbol,
        description: symbol,
        currency: 'RUB',
        minstep: 1
      };

      orderServiceSpy.submitLimitOrder.and.returnValue(of({}));
      const quantity = getRandomInt(1, 100);

      let testAsks: OrderbookDataRow[] = [
        { p: 6, v: 1, y: 0 },
        { p: 7, v: 1, y: 0 },
        { p: 8, v: 1, y: 0 },
      ];

      let testBids: OrderbookDataRow[] = [
        { p: testAsks[0].p - testInstrument.minstep * 2, v: 1, y: 0 },
        { p: testAsks[0].p - testInstrument.minstep * 3, v: 1, y: 0 },
        { p: testAsks[0].p - testInstrument.minstep * 4, v: 1, y: 0 }
      ];

      service.placeBestOrder(
        testSettings,
        testInstrument,
        Side.Buy,
        quantity,
        { a: testAsks, b: testBids },
        portfolioKey,
        { qtyTFuture: 1 } as Position
        );
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .withContext('Spread rows, Buy')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            price: testBids[0].p + testInstrument.minstep,
            quantity: quantity,
            instrument: testInstrument
          } as NewLimitOrder,
          portfolioKey.portfolio
        );

      orderServiceSpy.submitLimitOrder.calls.reset();

      service.placeBestOrder(
        testSettings,
        testInstrument,
        Side.Sell,
        quantity,
        { a: testAsks, b: testBids },
        portfolioKey,
        { qtyTFuture: 1 } as Position
      );
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .withContext('Spread rows, Sell')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            price: testAsks[0].p - testInstrument.minstep,
            quantity: quantity,
            instrument: testInstrument
          } as NewLimitOrder,
          portfolioKey.portfolio
        );

      testAsks = [
        { p: 6, v: 1, y: 0 },
        { p: 7, v: 1, y: 0 },
        { p: 8, v: 1, y: 0 },
      ];

      testBids = [
        { p: testAsks[0].p - 1, v: 1, y: 0 },
        { p: testAsks[0].p - 2, v: 1, y: 0 },
        { p: testAsks[0].p - 3, v: 1, y: 0 }
      ];

      orderServiceSpy.submitLimitOrder.calls.reset();
      service.placeBestOrder(
        testSettings,
        testInstrument,
        Side.Buy,
        quantity,
        { a: testAsks, b: testBids },
        portfolioKey,
        { qtyTFuture: 1 } as Position
      );
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .withContext('No spread, Buy')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            price: testBids[0].p,
            quantity: quantity,
            instrument: testInstrument
          } as NewLimitOrder,
          portfolioKey.portfolio
        );

      orderServiceSpy.submitLimitOrder.calls.reset();
      service.placeBestOrder(
        testSettings,
        testInstrument,
        Side.Sell,
        quantity,
        { a: testAsks, b: testBids },
        portfolioKey,
        { qtyTFuture: 1 } as Position
      );
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .withContext('No spread, Sell')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            price: testAsks[0].p,
            quantity: quantity,
            instrument: testInstrument
          } as NewLimitOrder,
          portfolioKey.portfolio
        );
    })
  );

  it('#placeBestOrder should create bracket', fakeAsync(() => {
    const portfolioKey: PortfolioKey = {
      exchange: generateRandomString(4),
      portfolio: generateRandomString(5),
    };

    const symbol = generateRandomString(4);
    const testInstrument: Instrument = {
      exchange: portfolioKey.exchange,
      symbol: symbol,
      shortName: symbol,
      description: symbol,
      currency: 'RUB',
      minstep: 1
    };

    testSettings = {
      ...testSettings,
      ...testInstrument,
      useBrackets: true,
      bracketsSettings: {
        topOrderPriceRatio: 1,
        bottomOrderPriceRatio: 2
      }
    };

    orderServiceSpy.submitOrdersGroup.and.returnValue(of({}));
    const quantity = getRandomInt(1, 100);

    let testAsks: OrderbookDataRow[] = [
      { p: 6, v: 1, y: 0 }
    ];
    let testBids: OrderbookDataRow[] = [
      { p: 5, v: 1, y: 0 }
    ];

    service.placeBestOrder(
      testSettings,
      testInstrument,
      Side.Buy,
      quantity,
      { a: testAsks, b: testBids },
      portfolioKey,
      { qtyTFuture: 1 } as Position
    );
    tick(10000);

    const expectedLimitOrder = {
      side: Side.Buy,
      quantity,
      price: testBids[0].p,
      instrument: testInstrument
    };

    expect(orderServiceSpy.submitOrdersGroup).toHaveBeenCalledOnceWith(
      [
        {
          ...expectedLimitOrder,
          type: 'Limit'
        },
        {
          ...expectedLimitOrder,
          type: 'StopLimit',
          condition: LessMore.MoreOrEqual,
          triggerPrice: MathHelper.roundPrice(testBids[0].p + (testSettings.bracketsSettings!.topOrderPriceRatio! * testInstrument.minstep), testInstrument.minstep),
          side: Side.Sell,
          activate: false
        },
        {
          ...expectedLimitOrder,
          type: 'StopLimit',
          condition: LessMore.LessOrEqual,
          triggerPrice: MathHelper.roundPrice(testBids[0].p - (testSettings.bracketsSettings!.bottomOrderPriceRatio! * testInstrument.minstep), testInstrument.minstep),
          side: Side.Sell,
          activate: false
        },
      ],
      portfolioKey.portfolio,
      ExecutionPolicy.TriggerBracketOrders
    );
  }));

  it('#sellBestBid should call service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
      };

      const symbol = generateRandomString(4);
      const testInstrument: Instrument = {
        exchange: portfolioKey.exchange,
        symbol: symbol,
        shortName: symbol,
        description: symbol,
        currency: 'RUB',
        minstep: 1
      };

      testSettings = {
        ...testSettings,
        ...testInstrument
      };

      orderServiceSpy.submitLimitOrder.and.returnValue(of({}));
      const quantity = getRandomInt(1, 100);

      let testAsks: OrderbookDataRow[] = [
        { p: 6, v: 1, y: 0 },
        { p: 7, v: 1, y: 0 },
        { p: 8, v: 1, y: 0 },
      ];

      let testBids: OrderbookDataRow[] = [
        { p: testAsks[0].p - 1, v: 1, y: 0 },
        { p: testAsks[0].p - 2, v: 1, y: 0 },
        { p: testAsks[0].p - 3, v: 1, y: 0 }
      ];

      service.sellBestBid(
        testSettings,
        testInstrument,
        quantity,
        { a: testAsks, b: testBids },
        portfolioKey,
        { qtyTFuture: 1 } as Position
      );
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            price: testBids[0].p,
            quantity: quantity,
            instrument: testSettings
          } as NewLimitOrder,
          portfolioKey.portfolio
        );
    })
  );

  it('#sellBestBid should create bracket', fakeAsync(() => {
    const portfolioKey: PortfolioKey = {
      exchange: generateRandomString(4),
      portfolio: generateRandomString(5),
    };

    const symbol = generateRandomString(4);
    const testInstrument: Instrument = {
      exchange: portfolioKey.exchange,
      symbol: symbol,
      shortName: symbol,
      description: symbol,
      currency: 'RUB',
      minstep: 1
    };

    testSettings = {
      ...testSettings,
      ...testInstrument,
      useBrackets: true,
      bracketsSettings: {
        topOrderPriceRatio: 1,
        bottomOrderPriceRatio: 2
      }
    };

    orderServiceSpy.submitOrdersGroup.and.returnValue(of({}));
    const quantity = getRandomInt(1, 100);

    let testAsks: OrderbookDataRow[] = [
      { p: 6, v: 1, y: 0 },
      { p: 7, v: 1, y: 0 },
      { p: 8, v: 1, y: 0 },
    ];

    let testBids: OrderbookDataRow[] = [
      { p: testAsks[0].p - 1, v: 1, y: 0 },
      { p: testAsks[0].p - 2, v: 1, y: 0 },
      { p: testAsks[0].p - 3, v: 1, y: 0 }
    ];

    service.sellBestBid(
      testSettings,
      testInstrument,
      quantity,
      { a: testAsks, b: testBids },
      portfolioKey,
      { qtyTFuture: 1 } as Position
    );
    tick(10000);

    const expectedLimitOrder = {
      side: Side.Sell,
      quantity,
      price: testBids[0].p,
      instrument: testSettings
    };

    expect(orderServiceSpy.submitOrdersGroup).toHaveBeenCalledOnceWith(
      [
        {
          ...expectedLimitOrder,
          type: 'Limit'
        },
        {
          ...expectedLimitOrder,
          type: 'StopLimit',
          condition: LessMore.MoreOrEqual,
          triggerPrice: MathHelper.roundPrice(testBids[0].p + (testSettings.bracketsSettings!.topOrderPriceRatio! * testInstrument.minstep), testInstrument.minstep),
          side: Side.Buy,
          activate: false
        },
        {
          ...expectedLimitOrder,
          type: 'StopLimit',
          condition: LessMore.LessOrEqual,
          triggerPrice: MathHelper.roundPrice(testBids[0].p - (testSettings.bracketsSettings!.bottomOrderPriceRatio! * testInstrument.minstep), testInstrument.minstep),
          side: Side.Buy,
          activate: false
        },
      ],
      portfolioKey.portfolio,
      ExecutionPolicy.TriggerBracketOrders
    );
  }));

  it('#buyBestAsk should call service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
      };

      const symbol = generateRandomString(4);
      const testInstrument: Instrument = {
        exchange: portfolioKey.exchange,
        symbol: symbol,
        shortName: symbol,
        description: symbol,
        currency: 'RUB',
        minstep: 1
      };

      testSettings = {
        ...testSettings,
        ...testInstrument
      };

      orderServiceSpy.submitLimitOrder.and.returnValue(of({}));
      const quantity = getRandomInt(1, 100);

      let testAsks: OrderbookDataRow[] = [
        { p: 6, v: 1, y: 0 },
        { p: 7, v: 1, y: 0 },
        { p: 8, v: 1, y: 0 },
      ];

      let testBids: OrderbookDataRow[] = [
        { p: testAsks[0].p - 1, v: 1, y: 0 },
        { p: testAsks[0].p - 2, v: 1, y: 0 },
        { p: testAsks[0].p - 3, v: 1, y: 0 }
      ];

      service.buyBestAsk(
        testSettings,
        testInstrument,
        quantity,
        { a: testAsks, b: testBids },
        portfolioKey,
        { qtyTFuture: 1 } as Position
        );
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            price: testAsks[0].p,
            quantity: quantity,
            instrument: testSettings
          } as NewLimitOrder,
          portfolioKey.portfolio
        );
    })
  );

  it('#buyBestAsk should create bracket', fakeAsync(() => {
    const portfolioKey: PortfolioKey = {
      exchange: generateRandomString(4),
      portfolio: generateRandomString(5),
    };

    const symbol = generateRandomString(4);
    const testInstrument: Instrument = {
      exchange: portfolioKey.exchange,
      symbol: symbol,
      shortName: symbol,
      description: symbol,
      currency: 'RUB',
      minstep: 1
    };

    testSettings = {
      ...testSettings,
      ...testInstrument,
      useBrackets: true,
      bracketsSettings: {
        bottomOrderPriceRatio: 2
      }
    };

    orderServiceSpy.submitOrdersGroup.and.returnValue(of({}));
    const quantity = getRandomInt(1, 100);

    let testAsks: OrderbookDataRow[] = [
      { p: 6, v: 1, y: 0 },
      { p: 7, v: 1, y: 0 },
      { p: 8, v: 1, y: 0 },
    ];

    let testBids: OrderbookDataRow[] = [
      { p: testAsks[0].p - 1, v: 1, y: 0 },
      { p: testAsks[0].p - 2, v: 1, y: 0 },
      { p: testAsks[0].p - 3, v: 1, y: 0 }
    ];

    service.buyBestAsk(
      testSettings,
      testInstrument,
      quantity,
      { a: testAsks, b: testBids },
      portfolioKey,
      { qtyTFuture: 1 } as Position
    );
    tick(10000);

    const expectedLimitOrder = {
      side: Side.Buy,
      quantity,
      price: testAsks[0].p,
      instrument: testSettings
    };

    expect(orderServiceSpy.submitOrdersGroup).toHaveBeenCalledOnceWith(
      [
        {
          ...expectedLimitOrder,
          type: 'Limit'
        },
        {
          ...expectedLimitOrder,
          type: 'StopLimit',
          condition: LessMore.LessOrEqual,
          triggerPrice: MathHelper.roundPrice(testAsks[0].p - (testSettings.bracketsSettings!.bottomOrderPriceRatio! * testInstrument.minstep), testInstrument.minstep),
          side: Side.Sell,
          activate: false
        },
      ],
      portfolioKey.portfolio,
      ExecutionPolicy.TriggerBracketOrders
    );
  }));

  it('#placeMarketOrder should call appropriate service with appropriate data', fakeAsync(() => {
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

      service.placeMarketOrder(
        testInstrumentKey,
        Side.Sell,
        quantity,
        true,
        portfolioKey
      );

      tick(10000);
      expect(orderServiceSpy.submitMarketOrder)
        .withContext('Sell')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity,
            instrument: testInstrumentKey
          } as NewMarketOrder,
          portfolioKey.portfolio
        );


      service.placeMarketOrder(
        testInstrumentKey,
        Side.Buy,
        quantity,
        false,
        portfolioKey
      );

      tick(10000);
      expect(ordersDialogServiceSpy.openNewOrderDialog)
        .withContext('Buy')
        .toHaveBeenCalledOnceWith(
          {
            instrumentKey: testInstrumentKey,
            initialValues: {
              orderType: OrderType.Market,
              quantity
            }
          } as OrderDialogParams
        );
    })
  );

  it('#placeLimitOrder should call appropriate service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
      };

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4)
      };
      const testInstrument: Instrument = {
        ...testInstrumentKey,
        minstep: 0.5
      } as Instrument;
      testSettings = {
        ...testSettings,
        ...testInstrumentKey
      };

      orderServiceSpy.submitLimitOrder.and.returnValue(of({}));
      const quantity = getRandomInt(1, 100);
      const price = getRandomInt(1, 1000);

      service.placeLimitOrder(
        testSettings,
        testInstrument,
        Side.Sell,
        quantity,
        price,
        true,
        portfolioKey,
        { qtyTFuture: 1 } as Position
      );

      tick(10000);
      expect(orderServiceSpy.submitLimitOrder)
        .withContext('Sell')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity,
            price: price,
            instrument: testSettings
          } as NewLimitOrder,
          portfolioKey.portfolio
        );

      service.placeLimitOrder(
        testSettings,
        testInstrument,
        Side.Buy,
        quantity,
        price,
        false,
        portfolioKey,
        { qtyTFuture: 1 } as Position
      );

      tick(10000);
      expect(ordersDialogServiceSpy.openNewOrderDialog)
        .withContext('Buy')
        .toHaveBeenCalledOnceWith(
          {
            instrumentKey: toInstrumentKey(testSettings),
            initialValues: {
              orderType: OrderType.Limit,
              quantity,
              price: price
            }
          } as OrderDialogParams
        );
    })
  );

  it('#placeLimitOrder should create bracket', fakeAsync(() => {
    const portfolioKey: PortfolioKey = {
      exchange: generateRandomString(4),
      portfolio: generateRandomString(5),
    };

    const testInstrumentKey: InstrumentKey = {
      exchange: portfolioKey.exchange,
      symbol: generateRandomString(4)
    };


    const testInstrument: Instrument = {
      ...testInstrumentKey,
      minstep: 0.5
    } as Instrument;

    testSettings = {
      ...testSettings,
      ...testInstrumentKey,
      useBrackets: true,
      bracketsSettings: {
        topOrderPriceRatio: 1,
        bottomOrderPriceRatio: 2,
      }
    };

    orderServiceSpy.submitOrdersGroup.and.returnValue(of({}));
    const quantity = getRandomInt(1, 100);
    const price = getRandomInt(1, 1000);

    service.placeLimitOrder(
      testSettings,
      testInstrument,
      Side.Buy,
      quantity,
      price,
      true,
      portfolioKey,
      { qtyTFuture: 1 } as Position
    );

    tick(10000);

    const expectedLimitOrder = {
      side: Side.Buy,
      quantity,
      price,
      instrument: testSettings
    };

    expect(orderServiceSpy.submitOrdersGroup).toHaveBeenCalledOnceWith(
      [
        {
          ...expectedLimitOrder,
          type: 'Limit'
        },
        {
          ...expectedLimitOrder,
          type: 'StopLimit',
          condition: LessMore.MoreOrEqual,
          triggerPrice: MathHelper.roundPrice(price + (testSettings.bracketsSettings!.topOrderPriceRatio! * testInstrument.minstep), testInstrument.minstep),
          side: Side.Sell,
          activate: false
        },
        {
          ...expectedLimitOrder,
          type: 'StopLimit',
          condition: LessMore.LessOrEqual,
          triggerPrice: MathHelper.roundPrice(price - (testSettings.bracketsSettings!.bottomOrderPriceRatio! * testInstrument.minstep), testInstrument.minstep),
          side: Side.Sell,
          activate: false
        },
      ],
      portfolioKey.portfolio,
      ExecutionPolicy.TriggerBracketOrders
    );
  }));

  it('#placeLimitOrder should create bracket with percent price ratio settings', fakeAsync(() => {
    const portfolioKey: PortfolioKey = {
      exchange: generateRandomString(4),
      portfolio: generateRandomString(5),
    };

    const testInstrumentKey: InstrumentKey = {
      exchange: portfolioKey.exchange,
      symbol: generateRandomString(4)
    };


    const testInstrument: Instrument = {
      ...testInstrumentKey,
      minstep: 0.5
    } as Instrument;

    testSettings = {
      ...testSettings,
      ...testInstrumentKey,
      useBrackets: true,
      bracketsSettings: {
        topOrderPriceRatio: 1,
        orderPriceUnits: PriceUnits.Percents
      }
    };

    orderServiceSpy.submitOrdersGroup.and.returnValue(of({}));
    const quantity = getRandomInt(1, 100);
    const price = getRandomInt(1, 1000);

    service.placeLimitOrder(
      testSettings,
      testInstrument,
      Side.Buy,
      quantity,
      price,
      true,
      portfolioKey,
      { qtyTFuture: 1 } as Position
    );

    tick(10000);

    const expectedLimitOrder = {
      side: Side.Buy,
      quantity,
      price,
      instrument: testSettings
    };

    expect(orderServiceSpy.submitOrdersGroup).toHaveBeenCalledOnceWith(
      [
        {
          ...expectedLimitOrder,
          type: 'Limit'
        },
        {
          ...expectedLimitOrder,
          type: 'StopLimit',
          condition: LessMore.MoreOrEqual,
          triggerPrice: MathHelper.roundPrice((1 + testSettings.bracketsSettings!.topOrderPriceRatio! * 0.01) * price, testInstrument.minstep),
          side: Side.Sell,
          activate: false
        }
      ],
      portfolioKey.portfolio,
      ExecutionPolicy.TriggerBracketOrders
    );
  }));

  it('#reversePositionsByMarket should call service with appropriate data', fakeAsync(() => {
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

      service.reversePositionsByMarket(position, testInstrumentKey.instrumentGroup ?? null);

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

      service.reversePositionsByMarket(position, testInstrumentKey.instrumentGroup ?? null);
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

  it('#setStopLimitForRow should call appropriate service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
      };

      flushMicrotasks();

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4)
      };

      orderServiceSpy.submitStopLimitOrder.and.returnValue(of({}));
      const quantity = getRandomInt(1, 100);
      const price = getRandomInt(1, 1000);

      service.setStopLimit(
        testInstrumentKey,
        price,
        quantity,
        Side.Sell,
        true,
        portfolioKey
      );

      tick(10000);
      expect(orderServiceSpy.submitStopLimitOrder)
        .withContext('Sell. Silent')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity: quantity,
            price,
            instrument: testInstrumentKey,
            triggerPrice: price,
            condition: LessMore.MoreOrEqual
          } as NewStopLimitOrder,
          portfolioKey.portfolio
        );

      orderServiceSpy.submitStopLimitOrder.calls.reset();
      service.setStopLimit(
        testInstrumentKey,
        price,
        quantity,
        Side.Buy,
        true,
        portfolioKey
      );

      tick(10000);
      expect(orderServiceSpy.submitStopLimitOrder)
        .withContext('Buy. Silent')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            quantity: quantity,
            price,
            instrument: testInstrumentKey,
            triggerPrice: price,
            condition: LessMore.LessOrEqual
          } as NewStopLimitOrder,
          portfolioKey.portfolio
        );


      service.setStopLimit(
        testInstrumentKey,
        price,
        quantity,
        Side.Buy,
        false,
        portfolioKey
      );

      tick(10000);
      expect(ordersDialogServiceSpy.openNewOrderDialog)
        .withContext('Show dialog')
        .toHaveBeenCalledOnceWith(jasmine.objectContaining({
          instrumentKey: testInstrumentKey,
          initialValues: {
            orderType: OrderType.Stop,
            quantity,
            price: price,
            stopOrder:{
              condition: LessMore.LessOrEqual,
              limit: true
            }
          }
        } as OrderDialogParams)
        );
    })
  );

  describe('#setStopLoss', () => {
    it('should notify if no positions', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
      };

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4),
        instrumentGroup: generateRandomString(4)
      };

      const currentPortfolioPosition: Position =
        {
          symbol: testInstrumentKey.symbol,
          qtyTFutureBatch: 0
        } as Position;

      service.setStopLoss(
        getRandomInt(1, 1000),
        Math.random() < 0.5,
        currentPortfolioPosition,
        testInstrumentKey.instrumentGroup ?? null,
        portfolioKey
      );

      tick(10000);
      expect(orderServiceSpy.submitStopMarketOrder).not.toHaveBeenCalled();
      expect(ordersDialogServiceSpy.openNewOrderDialog).not.toHaveBeenCalled();
      expect(notificationServiceSpy.error).toHaveBeenCalledTimes(1);
    }));

    it('should notify if wrong price', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
      };

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4)
      };

      let avgPrice = 100;

      let position = {
        symbol: testInstrumentKey.symbol,
        exchange: testInstrumentKey.exchange,
        qtyTFutureBatch: 1,
        avgPrice: avgPrice
      } as Position;

      service.setStopLoss(
        avgPrice + 1,
        Math.random() < 0.5,
        position,
        testInstrumentKey.instrumentGroup ?? null,
        portfolioKey
      );

      tick(10000);
      expect(orderServiceSpy.submitStopMarketOrder).not.toHaveBeenCalled();
      expect(ordersDialogServiceSpy.openNewOrderDialog).not.toHaveBeenCalled();
      expect(notificationServiceSpy.warning).toHaveBeenCalledTimes(1);

      position = {
        symbol: testInstrumentKey.symbol,
        qtyTFutureBatch: -1,
        avgPrice: avgPrice
      } as Position;

      notificationServiceSpy.warning.calls.reset();
      service.setStopLoss(
        avgPrice - 1,
        Math.random() < 0.5,
        position,
        testInstrumentKey.instrumentGroup ?? null,
        portfolioKey
      );

      tick(10000);
      expect(orderServiceSpy.submitStopMarketOrder).not.toHaveBeenCalled();
      expect(ordersDialogServiceSpy.openNewOrderDialog).not.toHaveBeenCalled();
      expect(notificationServiceSpy.warning).toHaveBeenCalledTimes(1);
    }));

    it('should call appropriate service with appropriate data', fakeAsync(() => {
        const portfolioKey: PortfolioKey = {
          exchange: generateRandomString(4),
          portfolio: generateRandomString(5),
        };

        const testInstrumentKey: InstrumentKey = {
          exchange: portfolioKey.exchange,
          symbol: generateRandomString(4),
          instrumentGroup: generateRandomString(4)
        };

        const avgPrice = 100;
        let expectedPrice = avgPrice - 1;
        let position: Position =
          {
            symbol: testInstrumentKey.symbol,
            exchange: testInstrumentKey.exchange,
            qtyTFuture: 10,
            qtyTFutureBatch: 1,
            avgPrice: 100
          } as Position;

        orderServiceSpy.submitStopMarketOrder.and.returnValue(of({}));

        service.setStopLoss(expectedPrice, true, position, testInstrumentKey.instrumentGroup ?? null, portfolioKey);
        tick(10000);
        expect(orderServiceSpy.submitStopMarketOrder).toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity: position.qtyTFutureBatch,
            triggerPrice: expectedPrice,
            condition: LessMore.LessOrEqual,
            instrument: testInstrumentKey
          } as NewStopMarketOrder,
          portfolioKey.portfolio
        );

        orderServiceSpy.submitStopMarketOrder.calls.reset();
        expectedPrice = avgPrice + 1;
        position.qtyTFutureBatch = -1;

        service.setStopLoss(expectedPrice, true, position, testInstrumentKey.instrumentGroup ?? null, portfolioKey);
        tick(10000);
        expect(orderServiceSpy.submitStopMarketOrder).toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            quantity: Math.abs(position.qtyTFutureBatch),
            triggerPrice: expectedPrice,
            condition: LessMore.MoreOrEqual,
            instrument: testInstrumentKey
          } as NewStopMarketOrder,
          portfolioKey.portfolio
        );
      })
    );
  });
});
