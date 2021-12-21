import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderbookPageComponent } from './orderbook-page.component';

describe('OrderbookPageComponent', () => {
  let component: OrderbookPageComponent;
  let fixture: ComponentFixture<OrderbookPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderbookPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
