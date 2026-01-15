import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrdersGroupModalComponent} from './orders-group-modal.component';
import {OrdersGroupService} from "../../../../shared/services/orders/orders-group.service";
import {EMPTY} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzTreeComponent} from "ng-zorro-antd/tree";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('OrdersGroupModalComponent', () => {
  let component: OrdersGroupModalComponent;
  let fixture: ComponentFixture<OrdersGroupModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        OrdersGroupModalComponent,
        MockComponents(
          NzTreeComponent,
        ),
        MockDirectives(
          NzTooltipDirective
        )
      ],
      providers: [
        {
          provide: OrdersGroupService,
          useValue: {
            getAllOrderGroups: jasmine.createSpy('getAllOrderGroups').and.returnValue(EMPTY)
          }
        },
        {
          provide: PortfolioSubscriptionsService,
          useValue: {
            getOrdersSubscription: jasmine.createSpy('getOrdersSubscription').and.returnValue(EMPTY),
            getStopOrdersSubscription: jasmine.createSpy('getStopOrdersSubscription').and.returnValue(EMPTY)
          }
        },
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(EMPTY)
          }
        },
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OrdersGroupModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.componentRef.setInput('groupId', '1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
