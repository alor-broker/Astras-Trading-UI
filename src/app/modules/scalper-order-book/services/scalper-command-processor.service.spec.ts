import { TestBed } from '@angular/core/testing';

import { ScalperCommandProcessorService } from './scalper-command-processor.service';
import { HotKeyCommandService } from '../../../shared/services/hot-key-command.service';
import { BehaviorSubject } from 'rxjs';
import { ScalperOrdersService } from './scalper-orders.service';
import { ModifierKeys } from '../../../shared/models/modifier-keys.model';
import {
  generateRandomString,
  getRandomInt
} from '../../../shared/utils/testing';
import {
  ScalperOrderBookSettings,
  VolumeHighlightMode
} from '../models/scalper-order-book-settings.model';
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import {
  BodyRow,
  CurrentOrderDisplay,
  ScalperOrderBookRowType
} from '../models/scalper-order-book.model';
import { ScalperOrderBookExtendedSettings } from '../models/scalper-order-book-data-context.model';
import { ScalperOrderBookCommands } from '../models/scalper-order-book-commands';
import { TerminalCommand } from '../../../shared/models/terminal-command';
import { Side } from '../../../shared/models/enums/side.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { PortfolioKey } from '../../../shared/models/portfolio-key.model';
import { OrderbookData } from '../../orderbook/models/orderbook-data.model';
import { Position } from '../../../shared/models/positions/position.model';

describe('ScalperCommandProcessorService', () => {
  let service: ScalperCommandProcessorService;

  let modifiersMock$: BehaviorSubject<ModifierKeys>;
  let scalperOrdersServiceSpy: any;

  const orderBookDefaultSettings: ScalperOrderBookSettings = {
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

    scalperOrdersServiceSpy = jasmine.createSpyObj(
      'ScalperOrdersService',
      [
        'setStopLimitForRow',
        'setStopLoss',
        'placeLimitOrder',
        'placeMarketOrder',
        'sellBestBid',
        'buyBestAsk',
        'reversePositionsByMarket',
        'cancelOrders',
        'closePositionsByMarket',
        'placeBestOrder'
      ]
    );

    dataContextMock = {
      extendedSettings$: new BehaviorSubject({
        widgetSettings: orderBookDefaultSettings,
        instrument: defaultInstrumentInfo
      } as ScalperOrderBookExtendedSettings),
      currentPortfolio$: new BehaviorSubject<PortfolioKey>({
        portfolio: 'D1234',
        exchange: orderBookDefaultSettings.ex
      } as PortfolioKey),
      orderBookData$: new BehaviorSubject<OrderbookData>({ a: [], b: [] } as OrderbookData),
      position$: new BehaviorSubject<Position | null>(null),
      currentOrders$: new BehaviorSubject<CurrentOrderDisplay[]>([]),
      workingVolume$: new BehaviorSubject<number>(1)
    };

  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HotKeyCommandService,
          useValue: {
            modifiers$: modifiersMock$
          }
        },
        {
          provide: ScalperOrdersService,
          useValue: scalperOrdersServiceSpy
        }
      ]
    });
    service = TestBed.inject(ScalperCommandProcessorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Hot keys', () => {
    it('should process cancelLimitOrdersAll command', ((done) => {
        const expectedOrder: CurrentOrderDisplay = {
          orderId: generateRandomString(5),
          type: 'limit',
          exchange: orderBookDefaultSettings.exchange,
          portfolio: 'D1234',
          linkedPrice: 100,
          side: Side.Buy,
          displayVolume: 100
        };

        scalperOrdersServiceSpy.cancelOrders.and.callFake((currentOrders: CurrentOrderDisplay[]) => {
          done();
          expect(currentOrders).toEqual([expectedOrder]);
        });

        dataContextMock.currentOrders$.next([expectedOrder]);

        service.processHotkeyPress(
          {
            type: ScalperOrderBookCommands.cancelLimitOrdersAll
          } as TerminalCommand,
          false,
          dataContextMock
        );
      })
    );

    it('should process closePositionsByMarketAll command', ((done) => {
        const expectedPosition = {
          symbol: orderBookDefaultSettings.symbol,
          exchange: orderBookDefaultSettings.exchange,
          qtyTFutureBatch: 0
        } as Position;

        scalperOrdersServiceSpy.closePositionsByMarket.and.callFake((position: Position) => {
          done();
          expect(position).toEqual(expectedPosition);
        });

        dataContextMock.position$.next(expectedPosition);

        service.processHotkeyPress(
          {
            type: ScalperOrderBookCommands.closePositionsByMarketAll
          } as TerminalCommand,
          false,
          dataContextMock
        );
      })
    );

    it('should process cancelLimitOrdersCurrent command', ((done) => {
        const expectedOrder: CurrentOrderDisplay = {
          orderId: generateRandomString(5),
          type: 'limit',
          exchange: orderBookDefaultSettings.exchange,
          portfolio: 'D1234',
          linkedPrice: 100,
          side: Side.Buy,
          displayVolume: 100
        };

        scalperOrdersServiceSpy.cancelOrders.and.callFake((currentOrders: CurrentOrderDisplay[]) => {
          done();
          expect(currentOrders).toEqual([expectedOrder]);
        });

        dataContextMock.currentOrders$.next([expectedOrder]);

        service.processHotkeyPress(
          {
            type: ScalperOrderBookCommands.cancelLimitOrdersCurrent
          } as TerminalCommand,
          true,
          dataContextMock
        );
      })
    );

    it('should process closePositionsByMarketCurrent command', ((done) => {
        const expectedPosition = {
          symbol: orderBookDefaultSettings.symbol,
          exchange: orderBookDefaultSettings.exchange,
          qtyTFutureBatch: 0
        } as Position;

        dataContextMock.position$.next(expectedPosition);

        scalperOrdersServiceSpy.closePositionsByMarket.and.callFake((position: Position) => {
          done();
          expect(position).toEqual(expectedPosition);
        });

        service.processHotkeyPress(
          {
            type: ScalperOrderBookCommands.closePositionsByMarketCurrent
          } as TerminalCommand,
          true,
          dataContextMock
        );
      })
    );

    it('should process sellBestOrder command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        dataContextMock.orderBookData$.next({
          a: [{
            p: getRandomInt(1, 1000),
            v: getRandomInt(1, 100),
            y: 0
          }],
          b: [],
        });

        dataContextMock.workingVolume$.next(workingVolume);


        scalperOrdersServiceSpy.placeBestOrder.and.callFake((instrument: Instrument, side: Side, quantity: number) => {
          done();

          expect(instrument).toEqual(defaultInstrumentInfo);
          expect(side).toEqual(Side.Sell);
          expect(quantity).toEqual(workingVolume);
        });

        service.processHotkeyPress(
          {
            type: ScalperOrderBookCommands.sellBestOrder
          } as TerminalCommand,
          true,
          dataContextMock
        );
      })
    );

    it('should process buyBestOrder command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        dataContextMock.orderBookData$.next({
          a: [{
            p: getRandomInt(1, 1000),
            v: getRandomInt(1, 100),
            y: 0
          }],
          b: [],
        });

        dataContextMock.workingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.placeBestOrder.and.callFake((instrument: Instrument, side: Side, quantity: number) => {
          done();

          expect(instrument).toEqual(defaultInstrumentInfo);
          expect(side).toEqual(Side.Buy);
          expect(quantity).toEqual(workingVolume);
        });

        service.processHotkeyPress(
          {
            type: ScalperOrderBookCommands.buyBestOrder
          } as TerminalCommand,
          true,
          dataContextMock
        );
      })
    );

    it('should process sellBestBid command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        dataContextMock.orderBookData$.next({
          a: [{
            p: getRandomInt(1, 1000),
            v: getRandomInt(1, 100),
            y: 0
          }],
          b: [{
            p: getRandomInt(1, 1000),
            v: getRandomInt(1, 100),
            y: 0
          }],
        });

        dataContextMock.workingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.sellBestBid.and.callFake((instrument: Instrument, quantity: number) => {
          done();

          expect(instrument).toEqual(defaultInstrumentInfo);
          expect(quantity).toEqual(workingVolume);
        });

        service.processHotkeyPress(
          {
            type: ScalperOrderBookCommands.sellBestBid
          } as TerminalCommand,
          true,
          dataContextMock
        );
      })
    );

    it('should process buyBestAsk command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        dataContextMock.orderBookData$.next({
          a: [{
            p: getRandomInt(1, 1000),
            v: getRandomInt(1, 100),
            y: 0
          }],
          b: [],
        });


        dataContextMock.workingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.buyBestAsk.and.callFake((instrument: Instrument, quantity: number) => {
          done();

          expect(instrument).toEqual(defaultInstrumentInfo);
          expect(quantity).toEqual(workingVolume);
        });

        service.processHotkeyPress(
          {
            type: ScalperOrderBookCommands.buyBestAsk
          } as TerminalCommand,
          true,
          dataContextMock
        );
      })
    );

    it('should process sellMarket command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        dataContextMock.workingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.placeMarketOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number, silent: boolean) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(side).toEqual(Side.Sell);
          expect(quantity).toEqual(workingVolume);
          expect(silent).toEqual(true);
        });

        service.processHotkeyPress(
          {
            type: ScalperOrderBookCommands.sellMarket
          } as TerminalCommand,
          true,
          dataContextMock
        );
      })
    );

    it('should process buyMarket command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        dataContextMock.workingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.placeMarketOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number, silent: boolean) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(side).toEqual(Side.Buy);
          expect(quantity).toEqual(workingVolume);
          expect(silent).toEqual(true);
        });

        service.processHotkeyPress(
          {
            type: ScalperOrderBookCommands.buyMarket
          } as TerminalCommand,
          true,
          dataContextMock
        );
      })
    );

    it('should process reversePositionsByMarketCurrent command', ((done) => {
        const expectedPosition = {
          symbol: orderBookDefaultSettings.symbol,
          exchange: orderBookDefaultSettings.exchange,
          qtyTFutureBatch: 0
        } as Position;

        dataContextMock.position$.next(expectedPosition);

        scalperOrdersServiceSpy.reversePositionsByMarket.and.callFake((position: Position) => {
          done();
          expect(position).toEqual(expectedPosition);
        });

        service.processHotkeyPress(
          {
            type: ScalperOrderBookCommands.reversePositionsByMarketCurrent
          } as TerminalCommand,
          true,
          dataContextMock
        );
      })
    );
  });

  describe('Mouse click', () => {
    it('should process Left click with Ctrl', (done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);
        event.ctrlKey = true;

        dataContextMock.extendedSettings$.next({
          instrument: defaultInstrumentInfo,
          widgetSettings: {
            ...orderBookDefaultSettings,
            enableMouseClickSilentOrders: true
          }
        });

        const workingVolume = getRandomInt(1, 100);
        dataContextMock.workingVolume$.next(workingVolume);

        const testRow = {
          price: getRandomInt(1, 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as BodyRow;

        scalperOrdersServiceSpy.setStopLimitForRow.and.callFake((instrumentKey: InstrumentKey, row: BodyRow, quantity: number, silent: boolean) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(row).toEqual(testRow);
          expect(quantity).toEqual(workingVolume);
          expect(silent).toEqual(true);
        });

        service.processLeftMouseClick(event, testRow, dataContextMock);
      })
    );

    it('should process Left click with Shift', (done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);
        event.shiftKey = true;

        dataContextMock.extendedSettings$.next({
          instrument: defaultInstrumentInfo,
          widgetSettings: {
            ...orderBookDefaultSettings,
            enableMouseClickSilentOrders: true
          }
        });

        const workingVolume = getRandomInt(1, 100);
        dataContextMock.workingVolume$.next(workingVolume);

        const expectedPosition = {
          symbol: orderBookDefaultSettings.symbol,
          exchange: orderBookDefaultSettings.exchange,
          qtyTFutureBatch: 0
        } as Position;

        dataContextMock.position$.next(expectedPosition);

        const testRow = {
          price: getRandomInt(1, 1000),
          rowType: ScalperOrderBookRowType.Ask
        } as BodyRow;

        scalperOrdersServiceSpy.setStopLoss.and.callFake((price: number, silent: boolean, position: Position | null) => {
          done();
          expect(position).toEqual(expectedPosition);
          expect(price).toEqual(testRow.price);
          expect(silent).toEqual(true);
        });

        service.processLeftMouseClick(event, testRow, dataContextMock);
      })
    );

    it('should process Left click WITHOUT Ctrl and Shift', (done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);

        dataContextMock.extendedSettings$.next({
          instrument: defaultInstrumentInfo,
          widgetSettings: {
            ...orderBookDefaultSettings,
            enableMouseClickSilentOrders: true
          }
        });

        const workingVolume = getRandomInt(1, 100);
        dataContextMock.workingVolume$.next(workingVolume);

        const testRow = {
          price: getRandomInt(1, 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as BodyRow;

        scalperOrdersServiceSpy.placeLimitOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number, price: number, silent: boolean) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(side).toEqual(testRow.rowType === ScalperOrderBookRowType.Bid ? Side.Buy : Side.Sell);
          expect(quantity).toEqual(workingVolume);
          expect(price).toEqual(testRow.price);
          expect(silent).toEqual(true);
        });

        service.processLeftMouseClick(event, testRow, dataContextMock);
      })
    );

    it('should process Right click', (done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);

        dataContextMock.extendedSettings$.next({
          instrument: defaultInstrumentInfo,
          widgetSettings: {
            ...orderBookDefaultSettings,
            enableMouseClickSilentOrders: true
          }
        });

        const workingVolume = getRandomInt(1, 100);
        dataContextMock.workingVolume$.next(workingVolume);

        const testRow = {
          price: getRandomInt(1, 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as BodyRow;

        scalperOrdersServiceSpy.placeMarketOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number, silent: boolean) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(side).toEqual(testRow.rowType === ScalperOrderBookRowType.Bid ? Side.Sell : Side.Buy);
          expect(quantity).toEqual(workingVolume);
          expect(silent).toEqual(true);
        });

        service.processRightMouseClick(event, testRow, dataContextMock);
      })
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
        symbol: orderBookDefaultSettings.symbol,
        exchange: orderBookDefaultSettings.exchange,
        qtyTFutureBatch: positionQty
      } as Position);

      modifiersMock$.next({
        altKey: true,
        shiftKey: false,
        ctrlKey: false
      });

      const testRow = {
        price: getRandomInt(1, 1000),
        rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
      } as BodyRow;

      scalperOrdersServiceSpy.placeLimitOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number, price: number, silent: boolean) => {
        done();
        expect(instrumentKey).toEqual(orderBookDefaultSettings);
        expect(side).toEqual(testRow.rowType === ScalperOrderBookRowType.Bid ? Side.Buy : Side.Sell);
        expect(quantity).toEqual(positionQty);
        expect(price).toEqual(testRow.price);
        expect(silent).toEqual(true);
      });

      service.processLeftMouseClick(event, testRow, dataContextMock);
    });
  });

});
