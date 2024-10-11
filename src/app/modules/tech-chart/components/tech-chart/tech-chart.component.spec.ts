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
import { TechChartSettings } from '../../models/tech-chart-settings.model';
import { TranslatorService } from "../../../../shared/services/translator.service";
import {TimezoneConverterService} from "../../../../shared/services/timezone-converter.service";
import {TimezoneConverter} from "../../../../shared/utils/timezone-converter";
import {TimezoneDisplayOption} from "../../../../shared/models/enums/timezone-display-option";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import { WidgetsSharedDataService } from "../../../../shared/services/widgets-shared-data.service";
import { TradesHistoryService } from "../../../../shared/services/trades-history.service";
import { MarketService } from "../../../../shared/services/market.service";
import { ChartTemplatesSettingsBrokerService } from "../../services/chart-templates-settings-broker.service";
import { LocalStorageService } from "../../../../shared/services/local-storage.service";
import { SyntheticInstrumentsService } from "../../services/synthetic-instruments.service";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";
import { InstrumentSearchService } from "../../services/instrument-search.service";
import { PositionDisplayExtension } from "../../extensions/position-display.extension";
import { OrdersDisplayExtension } from "../../extensions/orders-display.extension";
import { TradesDisplayExtension } from "../../extensions/trades-display.extension";
import { TestData } from "../../../../shared/utils/testing/test-data";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";

describe('TechChartComponent', () => {
  let component: TechChartComponent;
  let fixture: ComponentFixture<TechChartComponent>;

  let widgetSettingsServiceSpy: any;
  let techChartDatafeedServiceSpy: any;
  let themeServiceSpy: any;
  let instrumentsServiceSpy: any;
  let widgetsSharedDataServiceSpy: any;

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

    widgetsSharedDataServiceSpy = jasmine.createSpyObj('WidgetsSharedDataService', ['setDataProviderValue']);
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      declarations: [TechChartComponent],
      providers: [
        { provide: WidgetSettingsService, useValue: widgetSettingsServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: InstrumentsService, useValue: instrumentsServiceSpy },
        {
          provide: SyntheticInstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(new Subject())
          }
        },
        { provide: WidgetsSharedDataService, useValue: widgetsSharedDataServiceSpy },
        {
          provide: OrdersDialogService,
          useValue: {
            openNewOrderDialog: jasmine.createSpy('openNewOrderDialog').and.callThrough()
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedDashboard$: new Subject(),
            selectedPortfolio$: new Subject()
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
        {
          provide: TradesHistoryService,
          useValue: {
            getTradesHistoryForSymbol: jasmine.createSpy('getTradesHistoryForSymbol').and.returnValue(new Subject()),
          }
        },
        {
          provide: MarketService,
          useValue: {
            getAllExchanges: jasmine.createSpy('getAllExchanges').and.returnValue(new Subject())
          }
        },
        {
          provide: ChartTemplatesSettingsBrokerService,
          useValue: {
            getSavedTemplates: jasmine.createSpy('getSavedTemplates').and.returnValue(new Subject()),
            saveChartTemplate: jasmine.createSpy('saveChartTemplate').and.returnValue(new Subject()),
            removeTemplate: jasmine.createSpy('removeTemplate').and.returnValue(new Subject()),
          }
        },
        {
          provide: LocalStorageService,
          useValue: {
            removeItem: jasmine.createSpy('removeItem').and.callThrough(),
            getStringItem: jasmine.createSpy('getStringItem').and.returnValue(''),
            getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
            onOuterChange: jasmine.createSpy('onOuterChange').and.returnValue(new Subject())
          }
        },
        {
          provide: InstrumentSearchService,
          useValue: {
            openModal: jasmine.createSpy('openModal').and.callThrough(),
            modalData$: of(null)
          }
        },
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
        ...commonTestProviders
      ]
    })
      .overrideComponent(
        TechChartComponent,
        {
          set: {
            providers: [
              {
                provide: TechChartDatafeedService,
                useValue: techChartDatafeedServiceSpy
              },
              {
                provide: PositionDisplayExtension,
                useValue: jasmine.createSpyObj('PositionDisplayExtension', ['apply', 'update', 'destroyState'])
              },
              {
                provide: OrdersDisplayExtension,
                useValue: jasmine.createSpyObj('OrdersDisplayExtension', ['apply', 'update', 'destroyState'])
              },
              {
                provide: TradesDisplayExtension,
                useValue: jasmine.createSpyObj('TradesDisplayExtension', ['apply', 'update', 'destroyState'])
              }
            ]
          }
        }
      )
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
