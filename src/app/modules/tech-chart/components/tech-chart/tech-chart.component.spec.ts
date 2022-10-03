import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TechChartComponent } from './tech-chart.component';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { TechChartDatafeedService } from "../../services/tech-chart-datafeed.service";
import { of } from "rxjs";
import { TechChartSettings } from "../../../../shared/models/settings/tech-chart-settings.model";
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { TestData } from '../../../../shared/utils/testing';
import { WidgetsDataProviderService } from '../../../../shared/services/widgets-data-provider.service';
import { ModalService } from '../../../../shared/services/modal.service';

describe('TechChartComponent', () => {
  let component: TechChartComponent;
  let fixture: ComponentFixture<TechChartComponent>;

  let widgetSettingsServiceSpy: any;
  let techChartDatafeedServiceSpy: any;
  let instrumentsServiceSpy: any;
  let widgetsDataProviderServiceSpy: any;
  let modalServiceSpy: any;

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

    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
    instrumentsServiceSpy.getInstrument.and.returnValue(of(TestData.instruments[0]));

    widgetsDataProviderServiceSpy = jasmine.createSpyObj('WidgetsDataProviderService', ['addNewDataProvider', 'setDataProviderValue']);

    modalServiceSpy = jasmine.createSpyObj('ModalService', ['openCommandModal']);
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TechChartComponent],
      providers: [
        { provide: WidgetSettingsService, useValue: widgetSettingsServiceSpy },
        { provide: TechChartDatafeedService, useValue: techChartDatafeedServiceSpy },
        { provide: InstrumentsService, useValue: instrumentsServiceSpy },
        { provide: WidgetsDataProviderService, useValue: widgetsDataProviderServiceSpy },
        { provide: ModalService, useValue: modalServiceSpy },
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
