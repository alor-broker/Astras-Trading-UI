import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TechChartComponent } from './tech-chart.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { TechChartDatafeedService } from "../../services/tech-chart-datafeed.service";
import {
  of,
  Subject
} from "rxjs";
import {
  ThemeColors,
  ThemeSettings,
  ThemeType
} from '../../../../shared/models/settings/theme-settings.model';
import { ThemeService } from '../../../../shared/services/theme.service';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import {
  commonTestProviders,
  sharedModuleImportForTests,
  TestData
} from '../../../../shared/utils/testing';
import { WidgetsDataProviderService } from '../../../../shared/services/widgets-data-provider.service';
import { PortfolioSubscriptionsService } from '../../../../shared/services/portfolio-subscriptions.service';
import { OrderCancellerService } from '../../../../shared/services/order-canceller.service';
import { TechChartSettings } from '../../models/tech-chart-settings.model';
import { TranslatorService } from "../../../../shared/services/translator.service";
import {TimezoneConverterService} from "../../../../shared/services/timezone-converter.service";
import {TimezoneConverter} from "../../../../shared/utils/timezone-converter";
import {TimezoneDisplayOption} from "../../../../shared/models/enums/timezone-display-option";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";

describe('TechChartComponent', () => {
  let component: TechChartComponent;
  let fixture: ComponentFixture<TechChartComponent>;

  let widgetSettingsServiceSpy: any;
  let techChartDatafeedServiceSpy: any;
  let themeServiceSpy:any;
  let instrumentsServiceSpy: any;
  let widgetsDataProviderServiceSpy: any;
  let modalServiceSpy: any;
  let portfolioSubscriptionsServiceSpy: any;

  beforeEach(() => {
    widgetSettingsServiceSpy = jasmine.createSpyObj(
      'WidgetSettingsService',
      [
        'updateIsLinked',
        'getSettings',
        'updateSettings'
      ]);

    widgetSettingsServiceSpy.getSettings.and.returnValue(of({
      symbol: 'SBER',
      exchange: 'MOEX'
    } as TechChartSettings));

    techChartDatafeedServiceSpy = jasmine.createSpyObj(
      'TechChartDatafeedService',
      [
        'onReady',
        'resolveSymbol',
        'getBars',
        'subscribeBars',
        'unsubscribeBars',
        'getServerTime',
        'clear'
      ]);

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

    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
    instrumentsServiceSpy.getInstrument.and.returnValue(of(TestData.instruments[0]));

    widgetsDataProviderServiceSpy = jasmine.createSpyObj('WidgetsDataProviderService', ['addNewDataProvider', 'setDataProviderValue']);

    portfolioSubscriptionsServiceSpy = jasmine.createSpyObj(
      'PortfolioSubscriptionsService',
      [
        'getAllPositionsSubscription',
        'getOrdersSubscription',
        'getStopOrdersSubscription'
      ]);

    portfolioSubscriptionsServiceSpy.getAllPositionsSubscription.and.returnValue(new Subject());
    portfolioSubscriptionsServiceSpy.getOrdersSubscription.and.returnValue(new Subject());
    portfolioSubscriptionsServiceSpy.getStopOrdersSubscription.and.returnValue(new Subject());
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      declarations: [TechChartComponent],
      providers: [
        { provide: WidgetSettingsService, useValue: widgetSettingsServiceSpy },
        { provide: TechChartDatafeedService, useValue: techChartDatafeedServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: InstrumentsService, useValue: instrumentsServiceSpy },
        { provide: WidgetsDataProviderService, useValue: widgetsDataProviderServiceSpy },
        {
          provide: OrdersDialogService,
          useValue: {
            openNewOrderDialog: jasmine.createSpy('openNewOrderDialog').and.callThrough()
          }
        },
        { provide: PortfolioSubscriptionsService, useValue: portfolioSubscriptionsServiceSpy },
        {
          provide: OrderCancellerService,
          useValue: {
            cancelOrder: jasmine.createSpy('cancelOrder').and.returnValue(new Subject())
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(of(() => '')),
            getActiveLang: jasmine.createSpy('getActiveLang').and.returnValue('ru')
          }
        },
        {
          provide: TimezoneConverterService,
          useValue: {
            getConverter: jasmine.createSpy('getConverter').and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime))),
          }
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
