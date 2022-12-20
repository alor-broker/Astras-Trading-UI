import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersBasketComponent } from './orders-basket.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { Subject } from 'rxjs';
import { OrderService } from '../../../../shared/services/orders/order.service';
import { mockComponent } from '../../../../shared/utils/testing';

describe('OrdersBasketComponent', () => {
  let component: OrdersBasketComponent;
  let fixture: ComponentFixture<OrdersBasketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrdersBasketComponent,
        mockComponent({ selector: 'ats-orders-basket-item', inputs: ['exchange', 'formControl', 'totalBudget', 'itemIndex', 'enableDelete'] })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: OrderService,
          useValue: {
            getSettings: jasmine.createSpy('submitLimitOrder').and.returnValue(new Subject())
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersBasketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
