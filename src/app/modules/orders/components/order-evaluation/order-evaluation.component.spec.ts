import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderEvaluationComponent } from './order-evaluation.component';

describe('OrderEvaluationComponent', () => {
  let component: OrderEvaluationComponent;
  let fixture: ComponentFixture<OrderEvaluationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderEvaluationComponent]
    });
    fixture = TestBed.createComponent(OrderEvaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
