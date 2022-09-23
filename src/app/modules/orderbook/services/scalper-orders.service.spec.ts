import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import { ScalperOrdersService } from './scalper-orders.service';
import {
  generateRandomString,
  sharedModuleImportForTests
} from "../../../shared/utils/testing";
import { OrderCancellerService } from "../../../shared/services/order-canceller.service";
import { PositionsService } from "../../../shared/services/positions.service";
import { OrderService } from "../../../shared/services/orders/order.service";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { ModalService } from "../../../shared/services/modal.service";
import {
  CurrentOrder,
  ScalperOrderBookRow,
  ScalperOrderBookRowType
} from "../models/scalper-order-book.model";
import { of } from "rxjs";
import { Store } from "@ngrx/store";
import { selectNewPortfolio } from "../../../store/portfolios/portfolios.actions";
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
import { StopOrderCondition } from "../../../shared/models/enums/stoporder-conditions";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { OrderbookDataRow } from '../models/orderbook-data-row.model';

describe('ScalperOrdersService', () => {
  let service: ScalperOrdersService;
  let store: Store;

  let orderCancellerServiceSpy: any;
  let positionsServiceSpy: any;
  let orderServiceSpy: any;
  let notificationServiceSpy: any;
  let modalServiceSpy: any;

  beforeEach(() => {
    orderCancellerServiceSpy = jasmine.createSpyObj('OrderCancellerService', ['cancelOrder']);
    positionsServiceSpy = jasmine.createSpyObj('PositionsService', ['getAllByPortfolio']);

    orderServiceSpy = jasmine.createSpyObj(
      'OrderService',
      [
        'submitMarketOrder',
        'submitLimitOrder',
        'submitStopLimitOrder',
        'submitStopMarketOrder'
      ]
    );

    notificationServiceSpy = jasmine.createSpyObj('NzNotificationService', ['error']);
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
        { provide: PositionsService, useValue: positionsServiceSpy },
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: NzNotificationService, useValue: notificationServiceSpy },
        { provide: ModalService, useValue: modalServiceSpy },
      ]
    });

    service = TestBed.inject(ScalperOrdersService);
    store = TestBed.inject(Store);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#cancelOrders should call service with appropriate data', fakeAsync(() => {
      const testOrder: CurrentOrder = {
        price: 10,
        orderId: generateRandomString(5),
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
        type: 'limit',
        volume: 10
      };

      orderCancellerServiceSpy.cancelOrder.and.returnValue(of({}));
      service.cancelOrders([testOrder]);

      tick();
      expect(orderCancellerServiceSpy.cancelOrder).toHaveBeenCalledOnceWith({
        orderid: testOrder.orderId,
        exchange: testOrder.exchange,
        portfolio: testOrder.portfolio,
        stop: false
      });
    })
  );

  it('#closePositionsByMarket should call service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: generateRandomString(4),
        portfolio: generateRandomString(5),
      };

      store.dispatch(selectNewPortfolio({ portfolio: portfolioKey }));
      tick();

      const testInstrumentKey1: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4)
      };

      const testInstrumentKey2: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4)
      };

      const currentPortfolioPositions: Position[] = [
        {
          symbol: generateRandomString(4),
          qtyTFuture: Math.round(Math.random() * 100),
          qtyTFutureBatch: Math.round(Math.random() * 10)
        } as Position,
        {
          symbol: generateRandomString(4),
          qtyTFuture: Math.round(Math.random() * 100),
          qtyTFutureBatch: Math.round(Math.random() * 10)
        } as Position,
        {
          symbol: testInstrumentKey1.symbol,
          qtyTFuture: Math.round(Math.random() * 100),
          qtyTFutureBatch: Math.round(Math.random() * 10)
        } as Position,
        {
          symbol: testInstrumentKey2.symbol,
          qtyTFuture: Math.round(Math.random() * 100) * -1,
          qtyTFutureBatch: Math.round(Math.random() * 10) * -1
        } as Position,
      ];

      positionsServiceSpy.getAllByPortfolio.and.returnValue(of(currentPortfolioPositions));
      orderServiceSpy.submitMarketOrder.and.returnValue(of({}));

      service.closePositionsByMarket(testInstrumentKey1);
      tick();

      expect(orderServiceSpy.submitMarketOrder).toHaveBeenCalledOnceWith(
        {
          side: Side.Sell,
          quantity: currentPortfolioPositions[2].qtyTFutureBatch,
          instrument: testInstrumentKey1
        } as MarketOrder,
        portfolioKey.portfolio
      );

      orderServiceSpy.submitMarketOrder.calls.reset();
      service.closePositionsByMarket(testInstrumentKey2);
      tick();

      expect(orderServiceSpy.submitMarketOrder).toHaveBeenCalledOnceWith(
        {
          side: Side.Buy,
          quantity: Math.abs(currentPortfolioPositions[3].qtyTFutureBatch),
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

      store.dispatch(selectNewPortfolio({ portfolio: portfolioKey }));
      tick();

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
      const quantity = Math.round(Math.random() * 100);

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

      service.placeBestOrder(testInstrument, Side.Buy, quantity, { a: testAsks, b: testBids });
      tick();

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

      service.placeBestOrder(testInstrument, Side.Sell, quantity, { a: testAsks, b: testBids });
      tick();

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
      service.placeBestOrder(testInstrument, Side.Buy, quantity, { a: testAsks, b: testBids });
      tick();

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
      service.placeBestOrder(testInstrument, Side.Sell, quantity, { a: testAsks, b: testBids });
      tick();

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

      store.dispatch(selectNewPortfolio({ portfolio: portfolioKey }));
      tick();

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
      const quantity = Math.round(Math.random() * 100);

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

      service.sellBestBid(testInstrument, quantity, { a: testAsks, b: testBids });
      tick();

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

      store.dispatch(selectNewPortfolio({ portfolio: portfolioKey }));
      tick();

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
      const quantity = Math.round(Math.random() * 100);

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

      service.buyBestAsk(testInstrument, quantity, { a: testAsks, b: testBids });
      tick();

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

      store.dispatch(selectNewPortfolio({ portfolio: portfolioKey }));
      tick();

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4)
      };

      orderServiceSpy.submitMarketOrder.and.returnValue(of({}));
      const quantity = Math.round(Math.random() * 100);

      service.placeMarketOrder(
        testInstrumentKey,
        Side.Sell,
        quantity,
        true
      );

      tick();
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
        false
      );

      tick();
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

      store.dispatch(selectNewPortfolio({ portfolio: portfolioKey }));
      tick();

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4)
      };

      orderServiceSpy.submitLimitOrder.and.returnValue(of({}));
      const quantity = Math.round(Math.random() * 100);
      const price = Math.round(Math.random() * 1000);

      service.placeLimitOrder(
        testInstrumentKey,
        Side.Sell,
        quantity,
        price,
        true
      );

      tick();
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
        false
      );

      tick();
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

      store.dispatch(selectNewPortfolio({ portfolio: portfolioKey }));
      tick();

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4)
      };

      const currentPortfolioPositions: Position[] = [
        {
          symbol: generateRandomString(4),
          qtyTFuture: Math.round(Math.random() * 100),
          qtyTFutureBatch: Math.round(Math.random() * 10)
        } as Position,
        {
          symbol: testInstrumentKey.symbol,
          qtyTFuture: Math.round(Math.random() * 100),
          qtyTFutureBatch: Math.round(Math.random() * 10)
        } as Position,
      ];

      positionsServiceSpy.getAllByPortfolio.and.returnValue(of(currentPortfolioPositions));
      orderServiceSpy.submitMarketOrder.and.returnValue(of({}));

      service.reversePositionsByMarket(testInstrumentKey);

      tick();
      expect(orderServiceSpy.submitMarketOrder)
        .withContext('qtyTFutureBatch > 0')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity: currentPortfolioPositions[1].qtyTFutureBatch * 2,
            instrument: testInstrumentKey
          } as MarketOrder,
          portfolioKey.portfolio
        );

      orderServiceSpy.submitMarketOrder.calls.reset();
      currentPortfolioPositions[1].qtyTFutureBatch = currentPortfolioPositions[1].qtyTFutureBatch * -1;

      service.reversePositionsByMarket(testInstrumentKey);
      tick();
      expect(orderServiceSpy.submitMarketOrder)
        .withContext('qtyTFutureBatch < 0')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            quantity: Math.abs(currentPortfolioPositions[1].qtyTFutureBatch) * 2,
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

      store.dispatch(selectNewPortfolio({ portfolio: portfolioKey }));
      tick();

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4)
      };

      orderServiceSpy.submitStopLimitOrder.and.returnValue(of({}));
      const quantity = Math.round(Math.random() * 100);
      const price = Math.round(Math.random() * 1000);

      service.setStopLimitForRow(
        testInstrumentKey,
        { rowType: ScalperOrderBookRowType.Ask, price } as ScalperOrderBookRow,
        quantity,
        true
      );

      tick();
      expect(orderServiceSpy.submitStopLimitOrder)
        .withContext('Sell. Silent')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity: quantity,
            price,
            instrument: testInstrumentKey,
            triggerPrice: price,
            condition: StopOrderCondition.More
          } as StopLimitOrder,
          portfolioKey.portfolio
        );

      orderServiceSpy.submitStopLimitOrder.calls.reset();
      service.setStopLimitForRow(
        testInstrumentKey,
        { rowType: ScalperOrderBookRowType.Bid, price } as ScalperOrderBookRow,
        quantity,
        true
      );

      tick();
      expect(orderServiceSpy.submitStopLimitOrder)
        .withContext('Buy. Silent')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Buy,
            quantity: quantity,
            price,
            instrument: testInstrumentKey,
            triggerPrice: price,
            condition: StopOrderCondition.Less
          } as StopLimitOrder,
          portfolioKey.portfolio
        );


      service.setStopLimitForRow(
        testInstrumentKey,
        { rowType: ScalperOrderBookRowType.Bid, price } as ScalperOrderBookRow,
        quantity,
        false
      );

      tick();
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

      store.dispatch(selectNewPortfolio({ portfolio: portfolioKey }));
      tick();

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: generateRandomString(4)
      };

      const currentPortfolioPositions: Position[] = [
        {
          symbol: testInstrumentKey.symbol,
          qtyTFutureBatch: 0
        } as Position,
      ];

      positionsServiceSpy.getAllByPortfolio.and.returnValue(of(currentPortfolioPositions));
      service.setStopLoss(
        testInstrumentKey,
        Math.round(Math.random() * 1000),
        Math.random() < 0.5
      );

      tick();
      expect(orderServiceSpy.submitStopMarketOrder).not.toHaveBeenCalled();
      expect(modalServiceSpy.openCommandModal).not.toHaveBeenCalled();
      expect(notificationServiceSpy.error).toHaveBeenCalledTimes(1);
    }));

    it('should should call appropriate service with appropriate data', fakeAsync(() => {
        const portfolioKey: PortfolioKey = {
          exchange: generateRandomString(4),
          portfolio: generateRandomString(5),
        };

        store.dispatch(selectNewPortfolio({ portfolio: portfolioKey }));
        tick();

        const testInstrumentKey: InstrumentKey = {
          exchange: portfolioKey.exchange,
          symbol: generateRandomString(4)
        };

        const currentPortfolioPositions: Position[] = [
          {
            symbol: testInstrumentKey.symbol,
            qtyTFuture: 10,
            qtyTFutureBatch: 1
          } as Position,
        ];

        const price = Math.round(Math.random() * 1000);

        positionsServiceSpy.getAllByPortfolio.and.returnValue(of(currentPortfolioPositions));
        orderServiceSpy.submitStopMarketOrder.and.returnValue(of({}));

        service.setStopLoss(testInstrumentKey, price, true);
        tick();
        expect(orderServiceSpy.submitStopMarketOrder).toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity: currentPortfolioPositions[0].qtyTFutureBatch,
            triggerPrice: price,
            condition: StopOrderCondition.More,
            instrument: testInstrumentKey
          } as StopMarketOrder,
          portfolioKey.portfolio
        );

        service.setStopLoss(testInstrumentKey, price, false);
        tick();
        expect(modalServiceSpy.openCommandModal).toHaveBeenCalledOnceWith(jasmine.objectContaining({
          side: Side.Sell,
          instrument: testInstrumentKey,
          quantity: currentPortfolioPositions[0].qtyTFutureBatch,
          type: CommandType.Stop
        } as CommandParams));
      })
    );
  });
});
