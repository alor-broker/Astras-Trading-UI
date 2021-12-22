import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderbookWidgetComponent } from './orderbook-page.component';

describe('OrderbookPageComponent', () => {
  let component: OrderbookWidgetComponent;
  let fixture: ComponentFixture<OrderbookWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderbookWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
