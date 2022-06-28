import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderbookChartComponent } from './orderbook-chart.component';
import { of } from 'rxjs';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

describe('OrderbookChartComponent', () => {
  let component: OrderbookChartComponent;
  let fixture: ComponentFixture<OrderbookChartComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    const settingsMock = {
      symbol: 'SBER',
      exchange: 'MOEX',
      showTable: true
    };

    await TestBed.configureTestingModule({
      declarations: [OrderbookChartComponent],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)) }
        },
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
