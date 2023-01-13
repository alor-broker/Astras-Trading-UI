import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersBasketWidgetComponent } from './orders-basket-widget.component';
import { mockComponent } from '../../../../shared/utils/testing';

describe('OrdersBasketWidgetComponent', () => {
  let component: OrdersBasketWidgetComponent;
  let fixture: ComponentFixture<OrdersBasketWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrdersBasketWidgetComponent,
        mockComponent({ selector: 'ats-orders-basket', inputs: ['guid'] })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersBasketWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
