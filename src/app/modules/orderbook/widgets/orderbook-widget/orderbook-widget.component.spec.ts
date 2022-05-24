import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrderbookService } from '../../services/orderbook.service';

import { OrderbookWidgetComponent } from './orderbook-widget.component';

const settings = {
  symbol: 'SBER',
  exchange: 'MOEX'
};

describe('OrderbookWidgetComponent', () => {
  let component: OrderbookWidgetComponent;
  let fixture: ComponentFixture<OrderbookWidgetComponent>;
  const spyOb = jasmine.createSpyObj('OrderbookService', ['settings$', 'setSettings']);
  spyOb.settings$ = of(settings);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderbookWidgetComponent],
    }).compileComponents();

    TestBed.overrideComponent(OrderbookWidgetComponent, {
      set: {
        providers: [
          { provide: OrderbookService, useValue: spyOb }
        ]
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
