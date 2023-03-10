import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersIndicatorComponent } from './orders-indicator.component';
import { getTranslocoModule } from '../../../../shared/utils/testing';

describe('OrdersIndicatorComponent', () => {
  let component: OrdersIndicatorComponent;
  let fixture: ComponentFixture<OrdersIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [ OrdersIndicatorComponent ]
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
