import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { LightChartService } from '../../services/light-chart.service';

import { LightChartComponent } from './light-chart.component';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ngZorroMockComponents } from "../../../../shared/utils/testing";
import {
  ThemeColors,
  ThemeSettings,
  ThemeType
} from '../../../../shared/models/settings/theme-settings.model';
import { ThemeService } from '../../../../shared/services/theme.service';

describe('LightChartComponent', () => {
  let component: LightChartComponent;
  let fixture: ComponentFixture<LightChartComponent>;
  const spy = jasmine.createSpyObj('LightChartService', ['getExtendedSettings', 'unsubscribe', 'getBars']);
  spy.getBars.and.returnValue(of([]));
  const settings: LightChartSettings = {
    timeFrame: 'D',
    symbol: 'SBER',
    exchange: 'MOEX',
    guid: '123',
    width: 300,
    height: 300
  };

  spy.getExtendedSettings.and.returnValue(of(settings));

  const terminalSettingsServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
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
    await TestBed.configureTestingModule({
      declarations: [
        LightChartComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        { provide: LightChartService, useValue: spy },
        { provide: TimezoneConverterService, useValue: terminalSettingsServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
