import {
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick
} from '@angular/core/testing';

import { ScalperOrdersService } from './scalper-orders.service';
import {
  commonTestProviders,
  generateRandomString,
  getRandomInt,
  sharedModuleImportForTests
} from "../../../shared/utils/testing";
import { OrderCancellerService } from "../../../shared/services/order-canceller.service";
import { OrderService } from "../../../shared/services/orders/order.service";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { ModalService } from "../../../shared/services/modal.service";
import { of } from "rxjs";
import { Store } from "@ngrx/store";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Position } from "../../../shared/models/positions/position.model";
import {
  LimitOrder,
  MarketOrder,
  StopLimitOrder,
  StopMarketOrder
} from "../../command/models/order.model";
import { Side } from "../../../shared/models/enums/side.model";
import { CommandParams } from "../../../shared/models/commands/command-params.model";
import { CommandType } from "../../../shared/models/enums/command-type.model";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { CancelCommand } from '../../../shared/models/commands/cancel-command.model';
import { CurrentOrderDisplay } from '../models/scalper-order-book.model';
import { OrderbookDataRow } from '../../orderbook/models/orderbook-data.model';
import {LessMore} from "../../../shared/models/enums/less-more.model";

describe('ScalperOrdersService', () => {
  let service: ScalperOrdersService;
  let store: Store;

  let orderCancellerServiceSpy: any;
  let orderServiceSpy: any;
  let notificationServiceSpy: any;
  let modalServiceSpy: any;

  beforeEach(() => {
    orderCancellerServiceSpy = jasmine.createSpyObj('OrderCancellerService', ['cancelOrder']);

    orderServiceSpy = jasmine.createSpyObj(
      'OrderService',
      [
        'submitMarketOrder',
        'submitLimitOrder',
        'submitStopLimitOrder',
        'submitStopMarketOrder'
      ]
    );

    notificationServiceSpy = jasmine.createSpyObj('NzNotificationService', ['error', 'warning']);
    modalServiceSpy = jasmine.createSpyObj('ModalService', ['openCommandModal']);
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
        { provide: ModalService, useValue: modalServiceSpy },
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
        qtyTFuture: getRandomInt(1, 100),
        qtyTFutureBatch: getRandomInt(1, 10)
      } as Position;

      const position2 = {
        symbol: testInstrumentKey2.symbol,
        exchange: testInstrumentKey1.exchange,
        qtyTFuture: getRandomInt(1, 100) * -1,
        qtyTFutureBatch: getRandomInt(1, 10) * -1
      } as Position;

      orderServiceSpy.submitMarketOrder.and.returnValue(of({}));

      service.closePositionsByMarket(position1, testInstrumentKey1.instrumentGroup, portfolioKey);
      tick(10000);

      expect(orderServiceSpy.submitMarketOrder).toHaveBeenCalledOnceWith(
        {
          side: Side.Sell,
          quantity: position1.qtyTFutureBatch,
          instrument: testInstrumentKey1
        } as MarketOrder,
        portfolioKey.portfolio
      );

      orderServiceSpy.submitMarketOrder.calls.reset();
      service.closePositionsByMarket(position2, testInstrumentKey2.instrumentGroup, portfolioKey);
      tick(10000);

      expect(orderServiceSpy.submitMarketOrder).toHaveBeenCalledOnceWith(
        {
          side: Side.Buy,
          quantity: Math.abs(position2.qtyTFutureBatch),
          instrument: testInstrumentKey2
        } as MarketOrder,
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

      service.placeBestOrder(testInstrument, Side.Buy, quantity, { a: testAsks, b: testBids }, portfolioKey);
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .withContext('Spread rows, Buy')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            price: testBids[0].p + testInstrument.minstep,
            quantity: quantity,
            instrument: testInstrument
          } as LimitOrder,
          portfolioKey.portfolio
        );

      orderServiceSpy.submitLimitOrder.calls.reset();

      service.placeBestOrder(testInstrument, Side.Sell, quantity, { a: testAsks, b: testBids }, portfolioKey);
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .withContext('Spread rows, Sell')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            price: testAsks[0].p - testInstrument.minstep,
            quantity: quantity,
            instrument: testInstrument
          } as LimitOrder,
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
      service.placeBestOrder(testInstrument, Side.Buy, quantity, { a: testAsks, b: testBids }, portfolioKey);
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .withContext('No spread, Buy')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            price: testBids[0].p,
            quantity: quantity,
            instrument: testInstrument
          } as LimitOrder,
          portfolioKey.portfolio
        );

      orderServiceSpy.submitLimitOrder.calls.reset();
      service.placeBestOrder(testInstrument, Side.Sell, quantity, { a: testAsks, b: testBids }, portfolioKey);
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .withContext('No spread, Sell')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            price: testAsks[0].p,
            quantity: quantity,
            instrument: testInstrument
          } as LimitOrder,
          portfolioKey.portfolio
        );
    })
  );

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

      service.sellBestBid(testInstrument, quantity, { a: testAsks, b: testBids }, portfolioKey);
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            price: testBids[0].p,
            quantity: quantity,
            instrument: testInstrument
          } as LimitOrder,
          portfolioKey.portfolio
        );
    })
  );

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

      service.buyBestAsk(testInstrument, quantity, { a: testAsks, b: testBids }, portfolioKey);
      tick(10000);

      expect(orderServiceSpy.submitLimitOrder)
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            price: testAsks[0].p,
            quantity: quantity,
            instrument: testInstrument
          } as LimitOrder,
          portfolioKey.portfolio
        );
    })
  );

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
          } as MarketOrder,
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
      expect(modalServiceSpy.openCommandModal)
        .withContext('Buy')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            quantity,
            instrument: testInstrumentKey,
            type: CommandType.Market
          } as CommandParams
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

      orderServiceSpy.submitLimitOrder.and.returnValue(of({}));
      const quantity = getRandomInt(1, 100);
      const price = getRandomInt(1, 1000);

      service.placeLimitOrder(
        testInstrumentKey,
        Side.Sell,
        quantity,
        price,
        true,
        portfolioKey
      );

      tick(10000);
      expect(orderServiceSpy.submitLimitOrder)
        .withContext('Sell')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity,
            price: price,
            instrument: testInstrumentKey
          } as LimitOrder,
          portfolioKey.portfolio
        );

      service.placeLimitOrder(
        testInstrumentKey,
        Side.Buy,
        quantity,
        price,
        false,
        portfolioKey
      );

      tick(10000);
      expect(modalServiceSpy.openCommandModal)
        .withContext('Buy')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            quantity,
            instrument: testInstrumentKey,
            price: price,
            type: CommandType.Limit
          } as CommandParams
        );
    })
  );

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
        qtyTFutureBatch: getRandomInt(1, 10)
      } as Position;

      orderServiceSpy.submitMarketOrder.and.returnValue(of({}));

      service.reversePositionsByMarket(position, testInstrumentKey.instrumentGroup, portfolioKey);

      tick(10000);
      expect(orderServiceSpy.submitMarketOrder)
        .withContext('qtyTFutureBatch > 0')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity: position.qtyTFutureBatch * 2,
            instrument: testInstrumentKey
          } as MarketOrder,
          portfolioKey.portfolio
        );

      orderServiceSpy.submitMarketOrder.calls.reset();
      position.qtyTFutureBatch = position.qtyTFutureBatch * -1;

      service.reversePositionsByMarket(position, testInstrumentKey.instrumentGroup, portfolioKey);
      tick(10000);
      expect(orderServiceSpy.submitMarketOrder)
        .withContext('qtyTFutureBatch < 0')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            quantity: Math.abs(position.qtyTFutureBatch) * 2,
            instrument: testInstrumentKey
          } as MarketOrder,
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
            condition: LessMore.More
          } as StopLimitOrder,
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
            condition: LessMore.Less
          } as StopLimitOrder,
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
      expect(modalServiceSpy.openCommandModal)
        .withContext('Show dialog')
        .toHaveBeenCalledOnceWith(jasmine.objectContaining({
          side: Side.Buy,
          quantity,
          instrument: testInstrumentKey,
          price: price,
          type: CommandType.Stop
        } as CommandParams));
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
        testInstrumentKey.instrumentGroup,
        portfolioKey
      );

      tick(10000);
      expect(orderServiceSpy.submitStopMarketOrder).not.toHaveBeenCalled();
      expect(modalServiceSpy.openCommandModal).not.toHaveBeenCalled();
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
        testInstrumentKey.instrumentGroup,
        portfolioKey
      );

      tick(10000);
      expect(orderServiceSpy.submitStopMarketOrder).not.toHaveBeenCalled();
      expect(modalServiceSpy.openCommandModal).not.toHaveBeenCalled();
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
        testInstrumentKey.instrumentGroup,
        portfolioKey
      );

      tick(10000);
      expect(orderServiceSpy.submitStopMarketOrder).not.toHaveBeenCalled();
      expect(modalServiceSpy.openCommandModal).not.toHaveBeenCalled();
      expect(notificationServiceSpy.warning).toHaveBeenCalledTimes(1);
    }));

    it('should should call appropriate service with appropriate data', fakeAsync(() => {
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

        service.setStopLoss(expectedPrice, true, position, testInstrumentKey.instrumentGroup, portfolioKey);
        tick(10000);
        expect(orderServiceSpy.submitStopMarketOrder).toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity: position.qtyTFutureBatch,
            triggerPrice: expectedPrice,
            condition: LessMore.Less,
            instrument: testInstrumentKey
          } as StopMarketOrder,
          portfolioKey.portfolio
        );

        orderServiceSpy.submitStopMarketOrder.calls.reset();
        expectedPrice = avgPrice + 1;
        position.qtyTFutureBatch = -1;

        service.setStopLoss(expectedPrice, true, position, testInstrumentKey.instrumentGroup, portfolioKey);
        tick(10000);
        expect(orderServiceSpy.submitStopMarketOrder).toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            quantity: Math.abs(position.qtyTFutureBatch),
            triggerPrice: expectedPrice,
            condition: LessMore.More,
            instrument: testInstrumentKey
          } as StopMarketOrder,
          portfolioKey.portfolio
        );
      })
    );
  });
});
