import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookComponent } from './scalper-order-book.component';
import { Subject } from "rxjs";
import { ScalperOrderBook } from "../../models/scalper-order-book.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { ngZorroMockComponents } from "../../../../shared/utils/testing";
import { ScalperOrderBookSettings } from "../../../../shared/models/settings/scalper-order-book-settings.model";
import { ScalperOrderBookService } from "../../services/scalper-order-book.service";
import { TerminalSettings } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { ScalperOrdersService } from "../../services/scalper-orders.service";

describe('ScalperOrderBookComponent', () => {
  let component: ScalperOrderBookComponent;
  let fixture: ComponentFixture<ScalperOrderBookComponent>;

  const settingsMock = new Subject<ScalperOrderBookSettings>();
  const scalperOrderBookMock = new Subject<ScalperOrderBook>();
  const terminalSettingsMock = new Subject<TerminalSettings>();
  const instrumentMock = new Subject<Instrument>();

  let widgetSettingsServiceSpy: any;
  let scalperOrderBookServiceSpy: any;
  let terminalSettingsServiceSpy: any;
  let instrumentsServiceSpy: any;
  let scalperOrdersServiceSpy: any;

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

    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
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
});
