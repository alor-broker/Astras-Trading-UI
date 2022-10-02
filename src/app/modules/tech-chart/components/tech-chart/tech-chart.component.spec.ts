import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TechChartComponent } from './tech-chart.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { TechChartDatafeedService } from "../../services/tech-chart-datafeed.service";
import { of } from "rxjs";
import { TechChartSettings } from "../../../../shared/models/settings/tech-chart-settings.model";
import {
  ThemeColors,
  ThemeSettings,
  ThemeType
} from '../../../../shared/models/settings/theme-settings.model';
import { ThemeService } from '../../../../shared/services/theme.service';

describe('TechChartComponent', () => {
  let component: TechChartComponent;
  let fixture: ComponentFixture<TechChartComponent>;

  let widgetSettingsServiceSpy: any;
  let techChartDatafeedServiceSpy: any;
  let themeServiceSpy:any;

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
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TechChartComponent],
      providers: [
        { provide: WidgetSettingsService, useValue: widgetSettingsServiceSpy },
        { provide: TechChartDatafeedService, useValue: techChartDatafeedServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
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
