import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrdersBasketComponent} from './orders-basket.component';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {Subject} from 'rxjs';
import {EvaluationService} from '../../../../shared/services/evaluation.service';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {ORDER_COMMAND_SERVICE_TOKEN,} from "../../../../shared/services/orders/order-command.service";
import {MockComponents, MockDirectives} from "ng-mocks";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {PresetsComponent} from "../presets/presets.component";
import {OrdersBasketItemComponent} from "../orders-basket-item/orders-basket-item.component";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {InputNumberComponent} from "../../../../shared/components/input-number/input-number.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('OrdersBasketComponent', () => {
  let component: OrdersBasketComponent;
  let fixture: ComponentFixture<OrdersBasketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        OrdersBasketComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          PresetsComponent,
          OrdersBasketItemComponent,
          NzTypographyComponent,
          NzButtonComponent,
          InputNumberComponent
        ),
        MockDirectives(
          NzResizeObserverDirective,
          NzIconDirective
        )
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
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
