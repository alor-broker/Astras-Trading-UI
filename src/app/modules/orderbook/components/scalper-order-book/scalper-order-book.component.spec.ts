import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookComponent } from './scalper-order-book.component';
import {
  BehaviorSubject,
  Subject,
  take
} from "rxjs";
import {
  CurrentOrder,
  ScalperOrderBook,
  ScalperOrderBookRowType,
  ScalperOrderBookRowView
} from "../../models/scalper-order-book.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import {
  generateRandomString,
  getRandomInt,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { ScalperOrderBookSettings } from "../../../../shared/models/settings/scalper-order-book-settings.model";
import { ScalperOrderBookService } from "../../services/scalper-order-book.service";
import { TerminalSettings } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { ScalperOrdersService } from "../../services/scalper-orders.service";
import { HotKeyCommandService } from "../../../../shared/services/hot-key-command.service";
import { TerminalCommand } from "../../../../shared/models/terminal-command";
import { ScalperOrderBookCommands } from "../../models/scalper-order-book-commands";
import { Side } from "../../../../shared/models/enums/side.model";
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';

describe('ScalperOrderBookComponent', () => {
  let component: ScalperOrderBookComponent;
  let fixture: ComponentFixture<ScalperOrderBookComponent>;

  const orderBookDefaultSettings: ScalperOrderBookSettings = {
    guid: generateRandomString(10),
    symbol: 'SBER',
    exchange: 'MOEX',
    enableMouseClickSilentOrders: true,
    disableHotkeys: false,
    highlightHighVolume: false,
    showSpreadItems: false,
    showYieldForBonds: false,
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

  const settingsMock = new BehaviorSubject<ScalperOrderBookSettings>(orderBookDefaultSettings);
  const scalperOrderBookMock = new Subject<ScalperOrderBook>();
  const terminalSettingsMock = new Subject<TerminalSettings>();
  const instrumentMock = new BehaviorSubject<Instrument>(defaultInstrumentInfo);
  const hotKeyCommandMock = new Subject<TerminalCommand>();

  let widgetSettingsServiceSpy: any;
  let scalperOrderBookServiceSpy: any;
  let terminalSettingsServiceSpy: any;
  let instrumentsServiceSpy: any;
  let scalperOrdersServiceSpy: any;
  let hotKeyCommandServiceSpy: any;

  beforeEach(() => {
    widgetSettingsServiceSpy = jasmine.createSpyObj(
      'WidgetSettingsService',
      [
        'getSettings',
        'updateSettings'
      ]
    );

    widgetSettingsServiceSpy.getSettings.and.returnValue(settingsMock);

    scalperOrderBookServiceSpy = jasmine.createSpyObj('ScalperOrderBookService', ['getOrderBookRealtimeData']);
    scalperOrderBookServiceSpy.getOrderBookRealtimeData.and.returnValue(scalperOrderBookMock);

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
      ]
    );

    hotKeyCommandServiceSpy = jasmine.createSpyObj('HotKeyCommandService', ['commands$']);
    hotKeyCommandServiceSpy.commands$ = hotKeyCommandMock;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ScalperOrderBookComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        { provide: WidgetSettingsService, useValue: widgetSettingsServiceSpy },
        { provide: TerminalSettingsService, useValue: terminalSettingsServiceSpy },
        { provide: ScalperOrderBookService, useValue: scalperOrderBookServiceSpy },
        { provide: InstrumentsService, useValue: instrumentsServiceSpy },
        { provide: HotKeyCommandService, useValue: hotKeyCommandServiceSpy },
        { provide: ScalperOrdersService, useValue: scalperOrdersServiceSpy },
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
    it('should process cancelLimitOrdersAll command', (done => {
        const expectedOrder: CurrentOrder = {
          orderId: generateRandomString(5),
          volume: 10,
          type: 'limit',
          exchange: orderBookDefaultSettings.exchange,
          portfolio: 'D1234'
        };

        scalperOrderBookMock.next({
          asks: [{
            price: Math.random() * 1000,
            volume: Math.random() * 100,
            currentOrders: []
          }],
          bids: [],
          spreadItems: [],
          allActiveOrders: [expectedOrder]
        });

        scalperOrdersServiceSpy.cancelOrders.and.callFake((currentOrders: CurrentOrder[]) => {
          done();
          expect(currentOrders).toEqual([expectedOrder]);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.cancelLimitOrdersAll });
      })
    );

    it('should process closePositionsByMarketAll command', (done => {
        scalperOrdersServiceSpy.closePositionsByMarket.and.callFake((instrumentKey: InstrumentKey) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.closePositionsByMarketAll });
      })
    );

    it('should process cancelLimitOrdersCurrent command', (done => {
        const expectedOrder: CurrentOrder = {
          orderId: generateRandomString(5),
          volume: 10,
          type: 'limit',
          exchange: orderBookDefaultSettings.exchange,
          portfolio: 'D1234'
        };

        scalperOrderBookMock.next({
          asks: [{
            price: Math.random() * 1000,
            volume: Math.random() * 100,
            currentOrders: []
          }],
          bids: [],
          spreadItems: [],
          allActiveOrders: [expectedOrder]
        });

        component.isActiveOrderBook = true;

        scalperOrdersServiceSpy.cancelOrders.and.callFake((currentOrders: CurrentOrder[]) => {
          done();
          expect(currentOrders).toEqual([expectedOrder]);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.cancelLimitOrdersCurrent });
      })
    );

    it('should process closePositionsByMarketCurrent command', (done => {
        component.isActiveOrderBook = true;
        scalperOrdersServiceSpy.closePositionsByMarket.and.callFake((instrumentKey: InstrumentKey) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.closePositionsByMarketCurrent });
      })
    );

    it('should process sellBestOrder command', (done => {
        const workingVolume = Math.round(Math.random() * 100);

        scalperOrderBookMock.next({
          asks: [{
            price: Math.round(Math.random() * 1000),
            volume: Math.round(Math.random() * 100),
            currentOrders: []
          }],
          bids: [],
          spreadItems: [],
          allActiveOrders: []
        });

        component.isActiveOrderBook = true;
        component.activeWorkingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.placeBestOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number) => {
          done();

          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(side).toEqual(Side.Sell);
          expect(quantity).toEqual(workingVolume);
        });

        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.sellBestOrder });
      })
    );

    it('should process buyBestOrder command', (done => {
        const workingVolume = Math.round(Math.random() * 100);

        scalperOrderBookMock.next({
          asks: [{
            price: Math.round(Math.random() * 1000),
            volume: Math.round(Math.random() * 100),
            currentOrders: []
          }],
          bids: [],
          spreadItems: [],
          allActiveOrders: []
        });

        component.isActiveOrderBook = true;
        component.activeWorkingVolume$.next(workingVolume);

        scalperOrdersServiceSpy.placeBestOrder.and.callFake((instrumentKey: InstrumentKey, side: Side, quantity: number) => {
          done();

          expect(instrumentKey).toEqual(orderBookDefaultSettings);
          expect(side).toEqual(Side.Buy);
          expect(quantity).toEqual(workingVolume);
        });

        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.buyBestOrder });
      })
    );

    it('should process sellMarket command', (done => {
        const workingVolume = Math.round(Math.random() * 100);

        component.isActiveOrderBook = true;
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

    it('should process buyMarket command', (done => {
        const workingVolume = Math.round(Math.random() * 100);

        component.isActiveOrderBook = true;
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

    it('should process reversePositionsByMarketCurrent command', (done => {
        component.isActiveOrderBook = true;

        scalperOrdersServiceSpy.reversePositionsByMarket.and.callFake((instrumentKey: InstrumentKey) => {
          done();
          expect(instrumentKey).toEqual(orderBookDefaultSettings);
        });

        fixture.detectChanges();
        hotKeyCommandMock.next({ type: ScalperOrderBookCommands.reversePositionsByMarketCurrent });
      })
    );

    it('should process working volume selection', (done) => {
      component.isActiveOrderBook = true;
      component.workingVolumes = [1, 2, 3, 4, 5];
      const selectedIndex = getRandomInt(1, component.workingVolumes.length);

      fixture.detectChanges();
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

        const workingVolume = Math.round(Math.random() * 100);
        component.activeWorkingVolume$.next(workingVolume);
        fixture.detectChanges();

        const testRow = {
          price: Math.round(Math.random() * 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as ScalperOrderBookRowView;

        scalperOrdersServiceSpy.setStopLimitForRow.and.callFake((instrumentKey: InstrumentKey, row: ScalperOrderBookRowView, quantity: number, silent: boolean) => {
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
          price: Math.round(Math.random() * 1000),
          rowType: ScalperOrderBookRowType.Ask
        } as ScalperOrderBookRowView;

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

        const workingVolume = Math.round(Math.random() * 100);
        component.activeWorkingVolume$.next(workingVolume);
        fixture.detectChanges();

        const testRow = {
          price: Math.round(Math.random() * 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as ScalperOrderBookRowView;

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

        const workingVolume = Math.round(Math.random() * 100);
        component.activeWorkingVolume$.next(workingVolume);
        fixture.detectChanges();

        const testRow = {
          price: Math.round(Math.random() * 1000),
          rowType: Math.random() < 0.5 ? ScalperOrderBookRowType.Bid : ScalperOrderBookRowType.Ask
        } as ScalperOrderBookRowView;

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
  });
});
