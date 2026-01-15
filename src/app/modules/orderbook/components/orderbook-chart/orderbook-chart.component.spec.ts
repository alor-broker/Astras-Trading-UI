import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrderbookChartComponent} from './orderbook-chart.component';
import {of} from 'rxjs';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ThemeColors, ThemeSettings, ThemeType} from '../../../../shared/models/settings/theme-settings.model';
import {ThemeService} from '../../../../shared/services/theme.service';
import {TranslatorService} from "../../../../shared/services/translator.service";
import {MockDirectives} from "ng-mocks";
import {BaseChartDirective} from "ng2-charts";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('OrderbookChartComponent', () => {
  let component: OrderbookChartComponent;
  let fixture: ComponentFixture<OrderbookChartComponent>;

  const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['getThemeSettings']);
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

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const settingsMock = {
      symbol: 'SBER',
      exchange: 'MOEX',
      showTable: true
    };

    await TestBed.configureTestingModule({
      imports: [
        OrderbookChartComponent,
        MockDirectives(
          BaseChartDirective
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock))}
        },
        {provide: ThemeService, useValue: themeServiceSpy},
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(of(() => ''))
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.componentRef.setInput(
      'chartData',
      {
        asks: [],
        bids: []
      }
    );

    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
