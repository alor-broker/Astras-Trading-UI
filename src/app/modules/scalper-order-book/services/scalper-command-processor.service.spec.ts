import { TestBed } from '@angular/core/testing';

import { ScalperCommandProcessorService } from './scalper-command-processor.service';
import {
  BehaviorSubject,
  of
} from 'rxjs';
import {
  ScalperOrderBookWidgetSettings,
  VolumeHighlightMode
} from '../models/scalper-order-book-settings.model';
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import {
  BodyRow,
  CurrentOrderDisplay,
  ScalperOrderBookRowType
} from '../models/scalper-order-book.model';
import {
  OrderBook,
  ScalperOrderBookExtendedSettings
} from '../models/scalper-order-book-data-context.model';
import { Side } from '../../../shared/models/enums/side.model';
import { PortfolioKey } from '../../../shared/models/portfolio-key.model';
import { Position } from '../../../shared/models/positions/position.model';
import {
  ActiveOrderBookHotKeysTypes,
  AllOrderBooksHotKeysTypes,
  TerminalSettings
} from '../../../shared/models/terminal-settings/terminal-settings.model';
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import { OrderType } from "../../../shared/models/orders/order.model";
import {
  CancelOrdersCommand,
  CancelOrdersCommandArgs
} from "../commands/cancel-orders-command";
import {
  ClosePositionByMarketCommand,
  ClosePositionByMarketCommandArgs
} from "../commands/close-position-by-market-command";
import {
  SubmitMarketOrderCommand,
  SubmitMarketOrderCommandArgs
} from "../commands/submit-market-order-command";
import {
  ReversePositionByMarketCommand,
  ReversePositionByMarketCommandArgs
} from "../commands/reverse-position-by-market-command";
import {
  SubmitStopLimitOrderCommand,
  SubmitStopLimitOrderCommandArgs
} from "../commands/submit-stop-limit-order-command";
import {
  SetStopLossCommand,
  SetStopLossCommandArgs
} from "../commands/set-stop-loss-command";
import {
  SubmitLimitOrderCommand,
  SubmitLimitOrderCommandArgs
} from "../commands/submit-limit-order-command";
import {
  SubmitBestPriceOrderCommand,
  SubmitBestPriceOrderCommandArgs
} from "../commands/submit-best-price-order-command";
import {
  GetBestOfferCommand,
  GetBestOfferCommandArgs
} from "../commands/get-best-offer-command";
import { UpdateOrdersCommand } from "../commands/update-orders-command";
import {
  ModifierKeys,
  ScalperCommand
} from "../models/scalper-command";
import { ScalperHotKeyCommandService } from "./scalper-hot-key-command.service";
import { TestingHelpers } from "../../../shared/utils/testing/testing-helpers";

describe('ScalperCommandProcessorService', () => {
  let service: ScalperCommandProcessorService;

  let modifiersMock$: BehaviorSubject<ModifierKeys>;

  let cancelOrdersCommandSpy: any;
  let closePositionByMarketCommandSpy: any;
  let submitMarketOrderCommandSpy: any;
  let reversePositionByMarketCommandSpy: any;
  let submitStopLimitOrderCommandSpy: any;
  let setStopLossCommandSpy: any;
  let submitLimitOrderCommandSpy: any;
  let submitBestPriceOrderCommandSpy: any;
  let getBestOfferCommandSpy: any;
  let updateOrdersCommandSpy: any;

  const orderBookDefaultSettings: ScalperOrderBookWidgetSettings = {
    guid: TestingHelpers.generateRandomString(10),
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

  const defaultInstrumentInfo: Instrument = {
    symbol: orderBookDefaultSettings.symbol,
    exchange: orderBookDefaultSettings.exchange,
    shortName: orderBookDefaultSettings.symbol,
    description: orderBookDefaultSettings.symbol,
    currency: "RUB",
    minstep: 0.01
  };

  let dataContextMock: any;

  beforeEach(() => {
    modifiersMock$ = new BehaviorSubject<ModifierKeys>({
      altKey: false,
      ctrlKey: false,
      shiftKey: false
    });

    dataContextMock = {
      extendedSettings$: new BehaviorSubject({
        widgetSettings: orderBookDefaultSettings,
        instrument: defaultInstrumentInfo
      } as ScalperOrderBookExtendedSettings),
      currentPortfolio$: new BehaviorSubject<PortfolioKey>({
        portfolio: 'D1234',
        exchange: orderBookDefaultSettings.exchange
      } as PortfolioKey),
      orderBook$: new BehaviorSubject<OrderBook>({ instrumentKey: defaultInstrumentInfo, rows: { a: [], b: [] } }),
      position$: new BehaviorSubject<Position | null>(null),
      currentOrders$: new BehaviorSubject<CurrentOrderDisplay[]>([]),
      workingVolume$: new BehaviorSubject<number>(1)
    };

    cancelOrdersCommandSpy = jasmine.createSpyObj('CancelOrdersCommand', ['execute']);
    closePositionByMarketCommandSpy = jasmine.createSpyObj('ClosePositionByMarketCommand', ['execute']);
    submitMarketOrderCommandSpy = jasmine.createSpyObj('SubmitMarketOrderCommand', ['execute']);
    reversePositionByMarketCommandSpy = jasmine.createSpyObj('ReversePositionByMarketCommand', ['execute']);
    submitStopLimitOrderCommandSpy = jasmine.createSpyObj('SubmitStopLimitOrderCommand', ['execute']);
    setStopLossCommandSpy = jasmine.createSpyObj('SetStopLossCommand', ['execute']);
    submitLimitOrderCommandSpy = jasmine.createSpyObj('SubmitLimitOrderCommand', ['execute']);
    submitBestPriceOrderCommandSpy = jasmine.createSpyObj('SubmitBestPriceOrderCommand', ['execute']);
    getBestOfferCommandSpy = jasmine.createSpyObj('GetBestOfferCommand', ['execute']);
    updateOrdersCommandSpy = jasmine.createSpyObj('UpdateOrdersCommand', ['execute']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ScalperCommandProcessorService,
        {
          provide: ScalperHotKeyCommandService,
          useValue: {
            modifiers$: modifiersMock$
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({} as TerminalSettings))
          }
        },
        {
          provide: CancelOrdersCommand,
          useValue: cancelOrdersCommandSpy
        },
        {
          provide: ClosePositionByMarketCommand,
          useValue: closePositionByMarketCommandSpy
        },
        {
          provide: SubmitMarketOrderCommand,
          useValue: submitMarketOrderCommandSpy
        },
        {
          provide: ReversePositionByMarketCommand,
          useValue: reversePositionByMarketCommandSpy
        },
        {
          provide: SubmitStopLimitOrderCommand,
          useValue: submitStopLimitOrderCommandSpy
        },
        {
          provide: SetStopLossCommand,
          useValue: setStopLossCommandSpy
        },
        {
          provide: SubmitLimitOrderCommand,
          useValue: submitLimitOrderCommandSpy
        },
        {
          provide: SubmitBestPriceOrderCommand,
          useValue: submitBestPriceOrderCommandSpy
        },
        {
          provide: GetBestOfferCommand,
          useValue: getBestOfferCommandSpy
        },
        {
          provide: UpdateOrdersCommand,
          useValue: updateOrdersCommandSpy
        },
      ]
    });
    service = TestBed.inject(ScalperCommandProcessorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Hot keys', () => {
    it('should process cancelLimitOrdersAll command', (done) => {
        const expectedOrder: CurrentOrderDisplay = {
          orderId: TestingHelpers.generateRandomString(5),
          type: OrderType.Limit,
          targetInstrument: {
            symbol: "TEST",
            exchange: orderBookDefaultSettings.exchange,
          },
          ownedPortfolio: {
            portfolio: 'D1234',
            exchange: orderBookDefaultSettings.exchange
          },
          price: 100,
          side: Side.Buy,
          displayVolume: 100,
          isDirty: false
        };

        cancelOrdersCommandSpy.execute.and.callFake((args: CancelOrdersCommandArgs) => {
          done();
          expect(args.ordersToCancel[0]).toEqual({
            orderId: expectedOrder.orderId,
            exchange: expectedOrder.targetInstrument.exchange,
            portfolio: expectedOrder.ownedPortfolio.portfolio,
            orderType: expectedOrder.type
          });
        });

        dataContextMock.currentOrders$.next([expectedOrder]);

        service.processHotkeyPress(
          {
            type: AllOrderBooksHotKeysTypes.cancelOrdersAll
          } as ScalperCommand,
          false,
          dataContextMock
        );
      }
    );

    it('should process closePositionsByMarketAll command', (done) => {
        const expectedPosition = {
          targetInstrument: {
            symbol: orderBookDefaultSettings.symbol,
            exchange: orderBookDefaultSettings.exchange,
          },
          ownedPortfolio: {
            portfolio: 'D1234',
            exchange: orderBookDefaultSettings.exchange
          },
          qtyTFutureBatch: 0
        } as Position;

        closePositionByMarketCommandSpy.execute.and.callFake((args: ClosePositionByMarketCommandArgs) => {
          done();
          expect(args.currentPosition).toEqual(expectedPosition);
        });

        dataContextMock.position$.next(expectedPosition);

        service.processHotkeyPress(
          {
            type:  AllOrderBooksHotKeysTypes.closePositionsKey
          } as ScalperCommand,
          false,
          dataContextMock
        );
      }
    );

    it('should process cancelLimitOrdersCurrent command', (done) => {
        const expectedOrder: CurrentOrderDisplay = {
          orderId: TestingHelpers.generateRandomString(5),
          type: OrderType.Limit,
          targetInstrument: {
            symbol: "TEST",
            exchange: orderBookDefaultSettings.exchange,
          },
          ownedPortfolio: {
            portfolio: 'D1234',
            exchange: orderBookDefaultSettings.exchange
          },
          price: 100,
          side: Side.Buy,
          displayVolume: 100,
          isDirty: false
        };

        const secondOrder: CurrentOrderDisplay = {
          orderId: TestingHelpers.generateRandomString(5),
          type: OrderType.StopLimit,
          targetInstrument: {
            symbol: orderBookDefaultSettings.symbol,
            exchange: orderBookDefaultSettings.exchange,
          },
          ownedPortfolio: {
            portfolio: 'D1234',
            exchange: orderBookDefaultSettings.exchange
          },
          price: 100,
          triggerPrice: 99,
          side: Side.Buy,
          displayVolume: 100,
          isDirty: false
        };

        cancelOrdersCommandSpy.execute.and.callFake((args: CancelOrdersCommandArgs) => {
          done();

          expect(args.ordersToCancel.length).toBe(1);

          expect(args.ordersToCancel[0]).toEqual({
            orderId: expectedOrder.orderId,
            exchange: expectedOrder.targetInstrument.exchange,
            portfolio: expectedOrder.ownedPortfolio.portfolio,
            orderType: expectedOrder.type
          });
        });

        dataContextMock.currentOrders$.next([expectedOrder, secondOrder]);

        service.processHotkeyPress(
          {
            type: ActiveOrderBookHotKeysTypes.cancelOrderbookOrders
          } as ScalperCommand,
          true,
          dataContextMock
        );
      }
    );

    it('should process cancelStopOrdersCurrent command', (done) => {
        const expectedOrder: CurrentOrderDisplay = {
          orderId: TestingHelpers.generateRandomString(5),
          type: OrderType.StopMarket,
          targetInstrument: {
            symbol: "TEST",
            exchange: orderBookDefaultSettings.exchange,
          },
          ownedPortfolio: {
            portfolio: 'D1234',
            exchange: orderBookDefaultSettings.exchange
          },
          triggerPrice: 100,
          side: Side.Buy,
          displayVolume: 100,
          isDirty: false
        };

        const secondOrder: CurrentOrderDisplay = {
          orderId: TestingHelpers.generateRandomString(5),
          type: OrderType.Limit,
          targetInstrument: {
            symbol: orderBookDefaultSettings.symbol,
            exchange: orderBookDefaultSettings.exchange,
          },
          ownedPortfolio: {
            portfolio: 'D1234',
            exchange: orderBookDefaultSettings.exchange
          },
          side: Side.Buy,
          displayVolume: 100,
          isDirty: false
        };

        cancelOrdersCommandSpy.execute.and.callFake((args: CancelOrdersCommandArgs) => {
          done();

          expect(args.ordersToCancel.length).toBe(1);

          expect(args.ordersToCancel[0]).toEqual({
            orderId: expectedOrder.orderId,
            exchange: expectedOrder.targetInstrument.exchange,
            portfolio: expectedOrder.ownedPortfolio.portfolio,
            orderType: expectedOrder.type
          });
        });

        dataContextMock.currentOrders$.next([expectedOrder, secondOrder]);

        service.processHotkeyPress(
          {
            type: ActiveOrderBookHotKeysTypes.cancelStopOrdersCurrent
          } as ScalperCommand,
          true,
          dataContextMock
        );
      }
    );

    it('should process closePositionsByMarketCurrent command', (done) => {
        const expectedPosition = {
          targetInstrument: {
            symbol: orderBookDefaultSettings.symbol,
            exchange: orderBookDefaultSettings.exchange,
          },
          qtyTFutureBatch: 0
        } as Position;

        dataContextMock.position$.next(expectedPosition);

        closePositionByMarketCommandSpy.execute.and.callFake((args: ClosePositionByMarketCommandArgs) => {
          done();
          expect(args.currentPosition).toEqual(expectedPosition);
        });

        service.processHotkeyPress(
          {
            type: ActiveOrderBookHotKeysTypes.closeOrderbookPositions
          } as ScalperCommand,
          true,
          dataContextMock
        );
      }
    );

    it('should process sellBestOrder command', (done) => {
        const workingVolume = TestingHelpers.getRandomInt(1, 100);

        dataContextMock.orderBook$.next({
          instrumentKey: defaultInstrumentInfo,
          rows: {
            a: [{
              p: TestingHelpers.getRandomInt(1, 1000),
              v: TestingHelpers.getRandomInt(1, 100),
              y: 0
            }],
            b: [],
          }
        });

        dataContextMock.workingVolume$.next(workingVolume);

        submitBestPriceOrderCommandSpy.execute.and.callFake((args: SubmitBestPriceOrderCommandArgs) => {
          done();

          expect(args.instrumentKey).toEqual(orderBookDefaultSettings);
          expect(args.side).toEqual(Side.Sell);
          expect(args.quantity).toEqual(workingVolume);
        });

        service.processHotkeyPress(
          {
            type: ActiveOrderBookHotKeysTypes.sellBestOrder
          } as ScalperCommand,
          true,
          dataContextMock
        );
      }
    );

    it('should process buyBestOrder command', (done) => {
        const workingVolume = TestingHelpers.getRandomInt(1, 100);

        dataContextMock.orderBook$.next({
          instrumentKey: defaultInstrumentInfo,
          rows: {
            a: [{
              p: TestingHelpers.getRandomInt(1, 1000),
              v: TestingHelpers.getRandomInt(1, 100),
              y: 0
            }],
            b: [],
          }
        });

        dataContextMock.workingVolume$.next(workingVolume);

        submitBestPriceOrderCommandSpy.execute.and.callFake((args: SubmitBestPriceOrderCommandArgs) => {
          done();

          expect(args.instrumentKey).toEqual(orderBookDefaultSettings);
          expect(args.side).toEqual(Side.Buy);
          expect(args.quantity).toEqual(workingVolume);
        });

        service.processHotkeyPress(
          {
            type: ActiveOrderBookHotKeysTypes.buyBestOrder
          } as ScalperCommand,
          true,
          dataContextMock
        );
      }
    );

    it('should process sellBestBid command', (done) => {
        const workingVolume = TestingHelpers.getRandomInt(1, 100);

        dataContextMock.orderBook$.next({
          instrumentKey: defaultInstrumentInfo,
          rows: {
            a: [{
              p: TestingHelpers.getRandomInt(1, 1000),
              v: TestingHelpers.getRandomInt(1, 100),
              y: 0
            }],
            b: [{
              p: TestingHelpers.getRandomInt(1, 1000),
              v: TestingHelpers.getRandomInt(1, 100),
              y: 0
            }],
          }
        });

        dataContextMock.workingVolume$.next(workingVolume);

        getBestOfferCommandSpy.execute.and.callFake((args: GetBestOfferCommandArgs) => {
          done();

          expect(args.instrumentKey).toEqual(orderBookDefaultSettings);
          expect(args.quantity).toEqual(workingVolume);
        });

        service.processHotkeyPress(
          {
            type: ActiveOrderBookHotKeysTypes.sellBestBid
          } as ScalperCommand,
          true,
          dataContextMock
        );
      }
    );

    it('should process buyBestAsk command', (done) => {
        const workingVolume = TestingHelpers.getRandomInt(1, 100);

        dataContextMock.orderBook$.next({
          instrumentKey: defaultInstrumentInfo,
          rows: {
            a: [{
              p: TestingHelpers.getRandomInt(1, 1000),
              v: TestingHelpers.getRandomInt(1, 100),
              y: 0
            }],
            b: [],
          }
        });

        dataContextMock.workingVolume$.next(workingVolume);

        getBestOfferCommandSpy.execute.and.callFake((args: GetBestOfferCommandArgs) => {
          done();

          expect(args.instrumentKey).toEqual(orderBookDefaultSettings);
          expect(args.quantity).toEqual(workingVolume);
        });

        service.processHotkeyPress(
          {
            type: ActiveOrderBookHotKeysTypes.buyBestAsk
          } as ScalperCommand,
          true,
          dataContextMock
        );
      }
    );

    it('should process sellMarket command', (done) => {
        const workingVolume = TestingHelpers.getRandomInt(1, 100);

        dataContextMock.workingVolume$.next(workingVolume);

        submitMarketOrderCommandSpy.execute.and.callFake((args: SubmitMarketOrderCommandArgs) => {
          done();
          expect(args.instrumentKey).toEqual(orderBookDefaultSettings);
          expect(args.side).toEqual(Side.Sell);
          expect(args.quantity).toEqual(workingVolume);
          expect(args.silent).toEqual(true);
        });

        service.processHotkeyPress(
          {
            type: ActiveOrderBookHotKeysTypes.sellMarket
          } as ScalperCommand,
          true,
          dataContextMock
        );
      }
    );

    it('should process buyMarket command', (done) => {
        const workingVolume = TestingHelpers.getRandomInt(1, 100);

        dataContextMock.workingVolume$.next(workingVolume);

        submitMarketOrderCommandSpy.execute.and.callFake((args: SubmitMarketOrderCommandArgs) => {
          done();
          expect(args.instrumentKey).toEqual(orderBookDefaultSettings);
          expect(args.side).toEqual(Side.Buy);
          expect(args.quantity).toEqual(workingVolume);
          expect(args.silent).toEqual(true);
        });

        service.processHotkeyPress(
          {
            type: ActiveOrderBookHotKeysTypes.buyMarket
          } as ScalperCommand,
          true,
          dataContextMock
        );
      }
    );

    it('should process reversePositionsByMarketCurrent command', (done) => {
        const expectedPosition = {
          targetInstrument: {
            symbol: orderBookDefaultSettings.symbol,
            exchange: orderBookDefaultSettings.exchange,
          },
          qtyTFutureBatch: 0
        } as Position;

        dataContextMock.position$.next(expectedPosition);

        reversePositionByMarketCommandSpy.execute.and.callFake((args: ReversePositionByMarketCommandArgs) => {
          done();
          expect(args.currentPosition).toEqual(expectedPosition);
        });

        service.processHotkeyPress(
          {
            type: ActiveOrderBookHotKeysTypes.reverseOrderbookPositions
          } as ScalperCommand,
          true,
          dataContextMock
        );
      }
    );
  });

  describe('Mouse click', () => {
    it('should process Left click with Ctrl', done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);
        event.ctrlKey = true;

        dataContextMock.extendedSettings$.next({
          instrument: defaultInstrumentInfo,
          widgetSettings: {
            ...orderBookDefaultSettings,
            enableMouseClickSilentOrders: true
          }
        });

        const workingVolume = TestingHelpers.getRandomInt(1, 100);
        dataContextMock.workingVolume$.next(workingVolume);

        const testRow = {
          price: TestingHelpers.getRandomInt(1, 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as BodyRow;

        submitStopLimitOrderCommandSpy.execute.and.callFake((args: SubmitStopLimitOrderCommandArgs) => {
          done();
          expect(args.instrumentKey).toEqual(defaultInstrumentInfo);
          expect(args.triggerPrice).toEqual(testRow.price);
          expect(args.priceOptions?.distance).toEqual(0);
          expect(args.quantity).toEqual(workingVolume);
          expect(args.side).toEqual(testRow.rowType === ScalperOrderBookRowType.Bid ? Side.Sell : Side.Buy);
          expect(args.silent).toEqual(true);
        });

        service.processLeftMouseClick(event, testRow, dataContextMock);
      }
    );

    it('should process Left click with Shift', done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);
        event.shiftKey = true;

        dataContextMock.extendedSettings$.next({
          instrument: defaultInstrumentInfo,
          widgetSettings: {
            ...orderBookDefaultSettings,
            enableMouseClickSilentOrders: true
          }
        });

        const workingVolume = TestingHelpers.getRandomInt(1, 100);
        dataContextMock.workingVolume$.next(workingVolume);

        const expectedPosition = {
          targetInstrument: {
            symbol: orderBookDefaultSettings.symbol,
            exchange: orderBookDefaultSettings.exchange,
          },
          qtyTFutureBatch: 0
        } as Position;

        dataContextMock.position$.next(expectedPosition);

        const testRow = {
          price: TestingHelpers.getRandomInt(1, 1000),
          rowType: ScalperOrderBookRowType.Ask
        } as BodyRow;

        setStopLossCommandSpy.execute.and.callFake((args: SetStopLossCommandArgs) => {
          done();
          expect(args.currentPosition).toEqual(expectedPosition);
          expect(args.triggerPrice).toEqual(testRow.price);
          expect(args.silent).toEqual(true);
        });

        service.processLeftMouseClick(event, testRow, dataContextMock);
      }
    );

    it('should process Left click WITHOUT Ctrl and Shift', done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);

        dataContextMock.extendedSettings$.next({
          instrument: defaultInstrumentInfo,
          widgetSettings: {
            ...orderBookDefaultSettings,
            enableMouseClickSilentOrders: true
          }
        });

        const workingVolume = TestingHelpers.getRandomInt(1, 100);
        dataContextMock.workingVolume$.next(workingVolume);

        const testRow = {
          price: TestingHelpers.getRandomInt(1, 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as BodyRow;

        submitLimitOrderCommandSpy.execute.and.callFake((args: SubmitLimitOrderCommandArgs) => {
          done();

          expect(args.instrumentKey).toEqual(orderBookDefaultSettings);
          expect(args.side).toEqual(testRow.rowType === ScalperOrderBookRowType.Bid ? Side.Buy : Side.Sell);
          expect(args.quantity).toEqual(workingVolume);
          expect(args.price).toEqual(testRow.price);
          expect(args.silent).toEqual(true);
        });

        service.processLeftMouseClick(event, testRow, dataContextMock);
      }
    );

    it('should process Right click', done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);

        dataContextMock.extendedSettings$.next({
          instrument: defaultInstrumentInfo,
          widgetSettings: {
            ...orderBookDefaultSettings,
            enableMouseClickSilentOrders: true
          }
        });

        const workingVolume = TestingHelpers.getRandomInt(1, 100);
        dataContextMock.workingVolume$.next(workingVolume);

        const testRow = {
          price: TestingHelpers.getRandomInt(1, 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as BodyRow;

        submitMarketOrderCommandSpy.execute.and.callFake((args: SubmitMarketOrderCommandArgs) => {
          done();
          expect(args.instrumentKey).toEqual(orderBookDefaultSettings);
          expect(args.side).toEqual(testRow.rowType === ScalperOrderBookRowType.Bid ? Side.Sell : Side.Buy);
          expect(args.quantity).toEqual(workingVolume);
          expect(args.silent).toEqual(true);
        });

        service.processRightMouseClick(event, testRow, dataContextMock);
      }
    );

    it('should call commands with position qty instead working volume when alt pressed', done => {
      const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);

      dataContextMock.extendedSettings$.next({
        instrument: defaultInstrumentInfo,
        widgetSettings: {
          ...orderBookDefaultSettings,
          enableMouseClickSilentOrders: true
        }
      });

      const workingVolume = 51;
      dataContextMock.workingVolume$.next(workingVolume);

      const positionQty = 33;
      dataContextMock.position$.next({
        targetInstrument: {
          symbol: orderBookDefaultSettings.symbol,
          exchange: orderBookDefaultSettings.exchange,
        },
        qtyTFutureBatch: positionQty
      } as Position);

      modifiersMock$.next({
        altKey: true,
        shiftKey: false,
        ctrlKey: false
      });

      const testRow = {
        price: TestingHelpers.getRandomInt(1, 1000),
        rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
      } as BodyRow;

      submitLimitOrderCommandSpy.execute.and.callFake((args: SubmitLimitOrderCommandArgs) => {
        done();
        expect(args.instrumentKey).toEqual(orderBookDefaultSettings);
        expect(args.side).toEqual(testRow.rowType === ScalperOrderBookRowType.Bid ? Side.Buy : Side.Sell);
        expect(args.quantity).toEqual(positionQty);
        expect(args.price).toEqual(testRow.price);
        expect(args.silent).toEqual(true);
      });

      service.processLeftMouseClick(event, testRow, dataContextMock);
    });
  });
});
