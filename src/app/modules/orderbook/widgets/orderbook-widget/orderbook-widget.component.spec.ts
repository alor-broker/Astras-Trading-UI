import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderbookWidgetComponent } from './orderbook-widget.component';
import { mockComponent } from "../../../../shared/utils/testing";

const settings = {
  symbol: 'SBER',
  exchange: 'MOEX'
};

describe('OrderbookWidgetComponent', () => {
  let component: OrderbookWidgetComponent;
  let fixture: ComponentFixture<OrderbookWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrderbookWidgetComponent,
        mockComponent({
          selector: 'ats-order-book',
          inputs: ['guid', 'resize', 'shouldShowSettings']
        })
      ],
    }).compileComponents();

    TestBed.overrideComponent(OrderbookWidgetComponent, {
      set: {
        providers: []
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
