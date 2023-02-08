import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookComponent } from './scalper-order-book.component';
import {
  BehaviorSubject,
  of,
  Subject,
  take
} from "rxjs";
import {
  CurrentOrder,
  ScalperOrderBookRow,
  ScalperOrderBookRowType
} from "../../models/scalper-order-book.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import {
  generateRandomString,
  getRandomInt,
  getTranslocoModule, mockComponent,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { ScalperOrderBookService } from "../../services/scalper-order-book.service";
import { TerminalSettings } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { ScalperOrdersService } from "../../services/scalper-orders.service";
import { HotKeyCommandService } from "../../../../shared/services/hot-key-command.service";
import { TerminalCommand } from "../../../../shared/models/terminal-command";
import { ScalperOrderBookCommands } from "../../models/scalper-order-book-commands";
import { Side } from "../../../../shared/models/enums/side.model";
import { OrderbookData } from '../../models/orderbook-data.model';
import { Order } from '../../../../shared/models/orders/order.model';
import { OrderBookDataFeedHelper } from '../../utils/order-book-data-feed.helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { Position } from '../../../../shared/models/positions/position.model';
import {
  ThemeColors,
  ThemeSettings,
  ThemeType
} from '../../../../shared/models/settings/theme-settings.model';
import { ThemeService } from '../../../../shared/services/theme.service';
import {
  ScalperOrderBookSettings,
  VolumeHighlightMode
} from '../../models/scalper-order-book-settings.model';
import { ModifierKeys } from "../../../../shared/models/modifier-keys.model";
import ruScalperOrderbook from "../../../../../assets/i18n/orderbook/scalper-orderbook/ru.json";

describe('ScalperOrderBookComponent', () => {
  let component: ScalperOrderBookComponent;
  let fixture: ComponentFixture<ScalperOrderBookComponent>;

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

  const defaultModifiers: ModifierKeys = {
    shiftKey: false,
    altKey: false,
    ctrlKey: false
  };

  const defaultLastPrice = 101.24;
  const settingsMock = new BehaviorSubject<ScalperOrderBookSettings>(orderBookDefaultSettings);
  const orderBookDataMock = new Subject<OrderbookData>();
  const lastPriceMock = new BehaviorSubject<number>(defaultLastPrice);
  const currentOrdersMock = new BehaviorSubject<Order[]>([]);
  const positionMock = new BehaviorSubject<Position | null>(null);
  const terminalSettingsMock = new Subject<TerminalSettings>();
  const instrumentMock = new BehaviorSubject<Instrument>(defaultInstrumentInfo);
  const hotKeyCommandMock = new Subject<TerminalCommand>();
  const modifiersStream = new BehaviorSubject<ModifierKeys>(defaultModifiers);

  let widgetSettingsServiceSpy: any;
  let scalperOrderBookServiceSpy: any;
  let terminalSettingsServiceSpy: any;
  let instrumentsServiceSpy: any;
  let scalperOrdersServiceSpy: any;
  let hotKeyCommandServiceSpy: any;
  let themeServiceSpy: any;

  beforeEach(() => {
    widgetSettingsServiceSpy = jasmine.createSpyObj(
      'WidgetSettingsService',
      [
        'getSettings',
        'updateSettings'
      ]
    );

    widgetSettingsServiceSpy.getSettings.and.returnValue(settingsMock);

    scalperOrderBookServiceSpy = jasmine.createSpyObj(
      'ScalperOrderBookService',
      [
        'getOrderBook',
        'getLastPrice',
        'getCurrentOrders',
        'getOrderBookPosition'
      ]
    );

    scalperOrderBookServiceSpy.getOrderBook.and.returnValue(orderBookDataMock);
    scalperOrderBookServiceSpy.getLastPrice.and.returnValue(lastPriceMock);
    scalperOrderBookServiceSpy.getCurrentOrders.and.returnValue(currentOrdersMock);
    scalperOrderBookServiceSpy.getOrderBookPosition.and.returnValue(positionMock);

    terminalSettingsServiceSpy = jasmine.createSpyObj('TerminalSettingsService', ['getSettings']);
    terminalSettingsServiceSpy.getSettings.and.returnValue(terminalSettingsMock);

    instrumentsServiceSpy = jasmine.createSpyObj('HotKeyCommandService', ['getInstrument']);
    instrumentsServiceSpy.getInstrument.and.returnValue(instrumentMock);

    scalperOrdersServiceSpy = jasmine.createSpyObj(
      'ScalperOrdersService',
      [
        'cancelOrders',
        'closePositionsByMarket',
        'placeBestOrder',
        'placeMarketOrder',
        'placeLimitOrder',
        'reversePositionsByMarket',
        'setStopLimitForRow',
        'setStopLoss',
        'sellBestBid',
        'buyBestAsk',
        'getCurrentPositions'
      ]
    );

    hotKeyCommandServiceSpy = jasmine.createSpyObj('HotKeyCommandService', ['commands$', 'modifiers$']);
    hotKeyCommandServiceSpy.commands$ = hotKeyCommandMock;
    hotKeyCommandServiceSpy.modifiers$ = modifiersStream;

    themeServiceSpy = jasmine.createSpyObj('ThemeService', ['getThemeSettings']);
    themeServiceSpy.getThemeSettings.and.returnValue(of({
      theme: ThemeType.dark,
      themeColors: {
        sellColor: 'rgba(239,83,80, 1)',
        sellColorBackground: 'rgba(184, 27, 68, 0.4)',
        buyColor: 'rgba(12, 179, 130, 1',
        buyColorBackground: 'rgba(12, 179, 130, 0.4)',
        componentBackground: '#141414',
        primaryColor: '#177ddc',
        purpleColor: '#51258f',
        errorColor: '#a61d24'
      } as ThemeColors
    } as ThemeSettings));
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ScalperOrderBookComponent,
        ...ngZorroMockComponents,
        mockComponent({ selector: 'ats-modifiers-indicator' })
      ],
      imports: [
        getTranslocoModule({
          langs: {
            'command/ru': ruScalperOrderbook,
          }
        }),
      ],
      providers: [
        { provide: WidgetSettingsService, useValue: widgetSettingsServiceSpy },
        { provide: TerminalSettingsService, useValue: terminalSettingsServiceSpy },
        { provide: ScalperOrderBookService, useValue: scalperOrderBookServiceSpy },
        { provide: InstrumentsService, useValue: instrumentsServiceSpy },
        { provide: HotKeyCommandService, useValue: hotKeyCommandServiceSpy },
        { provide: ScalperOrdersService, useValue: scalperOrdersServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScalperOrderBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Hot keys', () => {
    it('should process cancelLimitOrdersAll command', ((done) => {
        const expectedOrder = {
          id: generateRandomString(5),
          qty: 10,
          type: 'limit',
          exchange: orderBookDefaultSettings.exchange,
          portfolio: 'D1234',
          price: 100,
        } as Order;

        currentOrdersMock.next([expectedOrder]);
        scalperOrdersServiceSpy.cancelOrders.and.callFake((currentOrders: CurrentOrder[]) => {
          done();
          expect(currentOrders).toEqual([OrderBookDataFeedHelper.orderToCurrentOrder(expectedOrder)]);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.cancelLimitOrdersAll });
      })
    );

    it('should process closePositionsByMarketAll command', ((done) => {
        scalperOrdersServiceSpy.closePositionsByMarket.and.callFake((instrumentKey: InstrumentKey) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.closePositionsByMarketAll });
      })
    );

    it('should process cancelLimitOrdersCurrent command', ((done) => {
        const expectedOrder = {
          id: generateRandomString(5),
          qty: 10,
          type: 'limit',
          exchange: orderBookDefaultSettings.exchange,
          portfolio: 'D1234',
          price: 100,
        } as Order;

        currentOrdersMock.next([expectedOrder]);
        component.isActive = true;

        scalperOrdersServiceSpy.cancelOrders.and.callFake((currentOrders: CurrentOrder[]) => {
          done();
          expect(currentOrders).toEqual([OrderBookDataFeedHelper.orderToCurrentOrder(expectedOrder)]);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.cancelLimitOrdersCurrent });
      })
    );

    it('should process closePositionsByMarketCurrent command', ((done) => {
        component.isActive = true;
        scalperOrdersServiceSpy.closePositionsByMarket.and.callFake((instrumentKey: InstrumentKey) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.closePositionsByMarketCurrent });
      })
    );

    it('should process sellBestOrder command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        orderBookDataMock.next({
          a: [{
            p: getRandomInt(1, 1000),
            v: getRandomInt(1, 100),
            y: 0
          }],
          b: [],
        });

        component.isActive = true;
        component.activeWorkingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.placeBestOrder.and.callFake((instrument: Instrument, side: Side, quantity: number) => {
          done();

          expect(instrument).toEqual(defaultInstrumentInfo);
          expect(side).toEqual(Side.Sell);
          expect(quantity).toEqual(workingVolume);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.sellBestOrder });
      })
    );

    it('should process buyBestOrder command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        orderBookDataMock.next({
          a: [{
            p: getRandomInt(1, 1000),
            v: getRandomInt(1, 100),
            y: 0
          }],
          b: [],
        });

        component.isActive = true;
        component.activeWorkingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.placeBestOrder.and.callFake((instrument: Instrument, side: Side, quantity: number) => {
          done();

          expect(instrument).toEqual(defaultInstrumentInfo);
          expect(side).toEqual(Side.Buy);
          expect(quantity).toEqual(workingVolume);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.buyBestOrder });
      })
    );

    it('should process sellBestBid command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        orderBookDataMock.next({
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

        component.isActive = true;
        component.activeWorkingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.sellBestBid.and.callFake((instrument: Instrument, quantity: number) => {
          done();

          expect(instrument).toEqual(defaultInstrumentInfo);
          expect(quantity).toEqual(workingVolume);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.sellBestBid });
      })
    );

    it('should process buyBestAsk command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        orderBookDataMock.next({
          a: [{
            p: getRandomInt(1, 1000),
            v: getRandomInt(1, 100),
            y: 0
          }],
          b: [],
        });

        component.isActive = true;
        component.activeWorkingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.buyBestAsk.and.callFake((instrument: Instrument, quantity: number) => {
          done();

          expect(instrument).toEqual(defaultInstrumentInfo);
          expect(quantity).toEqual(workingVolume);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.buyBestAsk });
      })
    );

    it('should process sellMarket command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        component.isActive = true;
        component.activeWorkingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.placeMarketOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number, silent: boolean) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(side).toEqual(Side.Sell);
          expect(quantity).toEqual(workingVolume);
          expect(silent).toEqual(true);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.sellMarket });
      })
    );

    it('should process buyMarket command', ((done) => {
        const workingVolume = getRandomInt(1, 100);

        component.isActive = true;
        component.activeWorkingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.placeMarketOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number, silent: boolean) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(side).toEqual(Side.Buy);
          expect(quantity).toEqual(workingVolume);
          expect(silent).toEqual(true);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.buyMarket });
      })
    );

    it('should process reversePositionsByMarketCurrent command', ((done) => {
        component.isActive = true;

        scalperOrdersServiceSpy.reversePositionsByMarket.and.callFake((instrumentKey: InstrumentKey) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.reversePositionsByMarketCurrent });
      })
    );

    it('should process working volume selection', (done) => {
      component.isActive = true;
      component.workingVolumes = [1, 2, 3, 4, 5];
      const selectedIndex = getRandomInt(1, component.workingVolumes.length);

      hotKeyCommandMock.next({ type: selectedIndex.toString() });

      component.activeWorkingVolume$.pipe(
        take(1)
      ).subscribe(value => {
        done();
        expect(value).toBe(component.workingVolumes[selectedIndex - 1]);
      });
    });
  });

  describe('Mouse click', () => {
    it('should process Left click with Ctrl', (done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);
        event.ctrlKey = true;

        const currentSettings = {
          ...orderBookDefaultSettings,
          enableMouseClickSilentOrders: true
        };

        settingsMock.next(currentSettings);
        fixture.detectChanges();

        const workingVolume = getRandomInt(1, 100);
        component.activeWorkingVolume$.next(workingVolume);
        fixture.detectChanges();

        const testRow = {
          price: getRandomInt(1, 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as ScalperOrderBookRow;

        scalperOrdersServiceSpy.setStopLimitForRow.and.callFake((instrumentKey: InstrumentKey, row: ScalperOrderBookRow, quantity: number, silent: boolean) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(row).toEqual(testRow);
          expect(quantity).toEqual(workingVolume);
          expect(silent).toEqual(currentSettings.enableMouseClickSilentOrders);
        });

        fixture.detectChanges();
        component.onRowClick(event, testRow);
      })
    );

    it('should process Left click with Shift', (done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);
        event.shiftKey = true;

        const currentSettings = {
          ...orderBookDefaultSettings,
          enableMouseClickSilentOrders: true
        };

        settingsMock.next(currentSettings);
        fixture.detectChanges();

        const testRow = {
          price: getRandomInt(1, 1000),
          rowType: ScalperOrderBookRowType.Ask
        } as ScalperOrderBookRow;

        scalperOrdersServiceSpy.setStopLoss.and.callFake((instrumentKey: InstrumentKey, price: number, silent: boolean) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(price).toEqual(testRow.price);
          expect(silent).toEqual(currentSettings.enableMouseClickSilentOrders);
        });

        fixture.detectChanges();
        component.onRowClick(event, testRow);
      })
    );

    it('should process Left click WITHOUT Ctrl and Shift', (done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);

        const currentSettings = {
          ...orderBookDefaultSettings,
          enableMouseClickSilentOrders: true
        };

        settingsMock.next(currentSettings);
        fixture.detectChanges();

        const workingVolume = getRandomInt(1, 100);
        component.activeWorkingVolume$.next(workingVolume);
        fixture.detectChanges();

        const testRow = {
          price: getRandomInt(1, 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as ScalperOrderBookRow;

        scalperOrdersServiceSpy.placeLimitOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number, price: number, silent: boolean) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(side).toEqual(testRow.rowType === ScalperOrderBookRowType.Bid ? Side.Buy : Side.Sell);
          expect(quantity).toEqual(workingVolume);
          expect(price).toEqual(testRow.price);
          expect(silent).toEqual(currentSettings.enableMouseClickSilentOrders);
        });

        fixture.detectChanges();
        component.onRowClick(event, testRow);
      })
    );

    it('should process Right click', (done => {
        const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);

        const currentSettings = {
          ...orderBookDefaultSettings,
          enableMouseClickSilentOrders: true
        };

        settingsMock.next(currentSettings);
        fixture.detectChanges();

        const workingVolume = getRandomInt(1, 100);
        component.activeWorkingVolume$.next(workingVolume);
        fixture.detectChanges();

        const testRow = {
          price: getRandomInt(1, 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as ScalperOrderBookRow;

        scalperOrdersServiceSpy.placeMarketOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number, silent: boolean) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(side).toEqual(testRow.rowType === ScalperOrderBookRowType.Bid ? Side.Sell : Side.Buy);
          expect(quantity).toEqual(workingVolume);
          expect(silent).toEqual(currentSettings.enableMouseClickSilentOrders);
        });

        fixture.detectChanges();
        component.onRowRightClick(event, testRow);
      })
    );

    it('should call commands with position qty instead working volume when alt pressed', done => {
      const event = jasmine.createSpyObj(['preventDefault', 'stopPropagation']);

      const currentSettings = {
        ...orderBookDefaultSettings,
        enableMouseClickSilentOrders: true
      };

      orderBookDataMock.next({
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

      settingsMock.next(currentSettings);
      fixture.detectChanges();

      modifiersStream.next({ shiftKey: false, ctrlKey: false, altKey: true });
      fixture.detectChanges();

      const positionQty = Math.round( 1000);
      positionMock.next({ qtyTFutureBatch: positionQty } as Position);

      const testRow = {
        rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
      } as ScalperOrderBookRow;

      scalperOrdersServiceSpy.placeLimitOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number, price: number, silent: boolean) => {
        done();
        expect(instrumentKey).toEqual(orderBookDefaultSettings);
        expect(side).toEqual(testRow.rowType === ScalperOrderBookRowType.Bid ? Side.Buy : Side.Sell);
        expect(quantity).toEqual(positionQty);
        expect(price).toEqual(testRow.price);
        expect(silent).toEqual(currentSettings.enableMouseClickSilentOrders);
      });

      fixture.detectChanges();
      component.onRowClick(event, testRow);
    });
  });
});
