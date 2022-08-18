import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderSubmitWidgetComponent } from './order-submit-widget.component';

describe('OrderSubmitWidgetComponent', () => {
  let component: OrderSubmitWidgetComponent;
  let fixture: ComponentFixture<OrderSubmitWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderSubmitWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderSubmitWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
