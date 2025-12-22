import {ComponentFixture, TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {OrderBook} from '../../models/orderbook.model';
import {OrderbookService} from '../../services/orderbook.service';

import {OrderBookComponent} from './orderbook.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ThemeColors, ThemeSettings, ThemeType} from '../../../../shared/models/settings/theme-settings.model';
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {MockComponents} from "ng-mocks";
import {OrderbookChartComponent} from "../orderbook-chart/orderbook-chart.component";
import {
  OrderbookTableVolumesAtTheEdgesComponent
} from "../orderbook-tables/orderbook-table-volumes-at-the-edges/orderbook-table-volumes-at-the-edges.component";
import {
  OrderbookTableVolumesAtTheMiddleComponent
} from "../orderbook-tables/orderbook-table-volumes-at-the-middle/orderbook-table-volumes-at-the-middle.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('OrderBookComponent', () => {
  let component: OrderBookComponent;
  let fixture: ComponentFixture<OrderBookComponent>;
  const spyOb = jasmine.createSpyObj('OrderbookService', ['getOrderBook']);
  const ob: OrderBook = {
    rows: [],
    maxVolume: 10,
    chartData: {
      asks: [],
      bids: []
    },
    bidVolumes: 0,
    askVolumes: 0
  };
  spyOb.getOrderBook.and.returnValue(of(ob));
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
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({
              symbol: 'SBER',
              exchange: 'MOEX',
              showTable: true
            }))
          }
        },
        {provide: OrderbookService, useValue: spyOb},
        ...commonTestProviders
      ],
      imports: [
        OrderBookComponent,
        MockComponents(
          OrderbookChartComponent,
          OrderbookTableVolumesAtTheEdgesComponent,
          OrderbookTableVolumesAtTheMiddleComponent,
        )
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderBookComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });
  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
