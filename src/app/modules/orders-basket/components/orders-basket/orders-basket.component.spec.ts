import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersBasketComponent } from './orders-basket.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { Subject } from 'rxjs';
import { EvaluationService } from '../../../../shared/services/evaluation.service';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
} from "../../../../shared/services/orders/order-command.service";

describe('OrdersBasketComponent', () => {
  let component: OrdersBasketComponent;
  let fixture: ComponentFixture<OrdersBasketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule()
      ],
      declarations: [
        OrdersBasketComponent,
        ComponentHelpers.mockComponent({ selector: 'ats-orders-basket-item', inputs: ['exchange', 'formControl', 'totalBudget', 'itemIndex', 'enableDelete'] })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: ORDER_COMMAND_SERVICE_TOKEN,
          useValue: {
            getSettings: jasmine.createSpy('submitLimitOrder').and.returnValue(new Subject())
          }
        },
        {
          provide: EvaluationService,
          useValue: {
            evaluateBatch: jasmine.createSpy('evaluateBatch').and.returnValue(new Subject())
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
