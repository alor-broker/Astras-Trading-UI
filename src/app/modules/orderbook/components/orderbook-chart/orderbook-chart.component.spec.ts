import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderbookChartComponent } from './orderbook-chart.component';
import { OrderbookService } from '../../services/orderbook.service';
import { of } from 'rxjs';

describe('OrderbookChartComponent', () => {
  let component: OrderbookChartComponent;
  let fixture: ComponentFixture<OrderbookChartComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    const spyOb = jasmine.createSpyObj('OrderbookService', ['getSettings']);
    spyOb.getSettings.and.returnValue(of({
      symbol: 'SBER',
      exchange: 'MOEX',
      showTable: true
    }));
    await TestBed.configureTestingModule({
      declarations: [OrderbookChartComponent],
      providers: [
        { provide: OrderbookService, useValue: spyOb },
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
