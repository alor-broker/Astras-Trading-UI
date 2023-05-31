import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersGroupModalComponent } from './orders-group-modal.component';
import { OrdersGroupService } from "../../../../shared/services/orders/orders-group.service";
import { of } from "rxjs";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { getTranslocoModule, ngZorroMockComponents } from "../../../../shared/utils/testing";

describe('OrdersGroupModalComponent', () => {
  let component: OrdersGroupModalComponent;
  let fixture: ComponentFixture<OrdersGroupModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrdersGroupModalComponent,
        ...ngZorroMockComponents
      ],
      imports: [ getTranslocoModule() ],
      providers: [
        {
          provide: OrdersGroupService,
          useValue: {
            getAllOrderGroups: jasmine.createSpy('getAllOrderGroups').and.returnValue(of([]))
          }
        },
        {
          provide: PortfolioSubscriptionsService,
          useValue: {
            getOrdersSubscription: jasmine.createSpy('getOrdersSubscription').and.returnValue(of([])),
            getStopOrdersSubscription: jasmine.createSpy('getStopOrdersSubscription').and.returnValue(of([]))
          }
        },
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({}))
          }
        },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersGroupModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
