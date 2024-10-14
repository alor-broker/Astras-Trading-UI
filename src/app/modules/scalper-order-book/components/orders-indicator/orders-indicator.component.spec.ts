import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersIndicatorComponent } from './orders-indicator.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('OrdersIndicatorComponent', () => {
  let component: OrdersIndicatorComponent;
  let fixture: ComponentFixture<OrdersIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      declarations: [OrdersIndicatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
