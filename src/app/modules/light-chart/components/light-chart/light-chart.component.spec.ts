import {ComponentFixture, TestBed} from '@angular/core/testing';
import {of} from 'rxjs';

import {LightChartComponent} from './light-chart.component';
import {TimezoneConverterService} from '../../../../shared/services/timezone-converter.service';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ThemeColors, ThemeSettings, ThemeType} from '../../../../shared/models/settings/theme-settings.model';
import {ThemeService} from '../../../../shared/services/theme.service';
import {InstrumentsService} from '../../../instruments/services/instruments.service';
import {Instrument} from '../../../../shared/models/instruments/instrument.model';
import {LightChartDatafeedFactoryService} from '../../services/light-chart-datafeed-factory.service';
import {TranslatorService} from "../../../../shared/services/translator.service";
import {MockComponents, MockDirectives} from "ng-mocks";
import {TimeframesPanelComponent} from "../timeframes-panel/timeframes-panel.component";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('LightChartComponent', () => {
  let component: LightChartComponent;
  let fixture: ComponentFixture<LightChartComponent>;

  const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
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

  const instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
  instrumentsServiceSpy.getInstrument.and.returnValue(of({
    symbol: 'SBER',
    exchange: 'MOEX',
    instrumentGroup: 'TQBR',
    description: 'description',
    currency: 'RUB',
    minstep: 0.01,
    type: 'type'
  } as Instrument));

  const lightChartDatafeedFactoryService = jasmine.createSpyObj('LightChartDatafeedFactoryService', ['getDatafeed']);
  lightChartDatafeedFactoryService.getDatafeed.and.returnValue({});

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LightChartComponent,
        MockComponents(
          TimeframesPanelComponent
        ),
        MockDirectives(
          NzResizeObserverDirective
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        {provide: InstrumentsService, useValue: instrumentsServiceSpy},
        {provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy},
        {provide: ThemeService, useValue: themeServiceSpy},
        {provide: LightChartDatafeedFactoryService, useValue: lightChartDatafeedFactoryService},
        {
          provide: TranslatorService,
          useValue: {
            getLangChanges: jasmine.createSpy('getLangChanges').and.returnValue(of('ru'))
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
