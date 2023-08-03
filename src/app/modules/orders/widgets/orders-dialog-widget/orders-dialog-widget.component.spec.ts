import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersDialogWidgetComponent } from './orders-dialog-widget.component';

describe('OrdersDialogWidgetComponent', () => {
  let component: OrdersDialogWidgetComponent;
  let fixture: ComponentFixture<OrdersDialogWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrdersDialogWidgetComponent]
    });
    fixture = TestBed.createComponent(OrdersDialogWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
