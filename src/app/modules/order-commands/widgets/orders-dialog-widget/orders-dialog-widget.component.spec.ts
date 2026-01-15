import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrdersDialogWidgetComponent} from './orders-dialog-widget.component';
import {BehaviorSubject, Subject} from "rxjs";
import {ModalService} from "../../../../shared/services/modal.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {EnvironmentService} from "../../../../shared/services/environment.service";
import {HelpService} from "../../../../shared/services/help.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {ORDER_COMMAND_SERVICE_TOKEN} from "../../../../shared/services/orders/order-command.service";
import {PUSH_NOTIFICATIONS_CONFIG} from "../../../push-notifications/services/push-notifications-config";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzModalComponent, NzModalContentDirective} from "ng-zorro-antd/modal";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {InstrumentInfoComponent} from "../../components/instrument-info/instrument-info.component";
import {NzTabComponent, NzTabsComponent} from "ng-zorro-antd/tabs";
import {LimitOrderFormComponent} from "../../components/order-forms/limit-order-form/limit-order-form.component";
import {MarketOrderFormComponent} from "../../components/order-forms/market-order-form/market-order-form.component";
import {StopOrderFormComponent} from "../../components/order-forms/stop-order-form/stop-order-form.component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {
  SetupInstrumentNotificationsComponent
} from "../../../push-notifications/components/setup-instrument-notifications/setup-instrument-notifications.component";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {NzButtonComponent} from "ng-zorro-antd/button";

describe('OrdersDialogWidgetComponent', () => {
  let component: OrdersDialogWidgetComponent;
  let fixture: ComponentFixture<OrdersDialogWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        OrdersDialogWidgetComponent,
        MockComponents(
          NzModalComponent,
          InstrumentInfoComponent,
          NzTabsComponent,
          NzTabComponent,
          LimitOrderFormComponent,
          MarketOrderFormComponent,
          StopOrderFormComponent,
          SetupInstrumentNotificationsComponent,
          NzTypographyComponent,
          NzButtonComponent
        ),
        MockDirectives(
          NzModalContentDirective,
          NzResizeObserverDirective,
          NzIconDirective,
        )
      ],
      providers: [
        {
          provide: OrdersDialogService,
          useValue: {
            newOrderDialogParameters$: new BehaviorSubject(null),
            closeNewOrderDialog: jasmine.createSpy('closeNewOrderDialog').and.callThrough()
          }
        },
        {
          provide: ModalService,
          useValue: {
            openHelpModal: jasmine.createSpy('openHelpModal').and.callThrough()
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedPortfolio$: new Subject()
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(new Subject())
          }
        },
        {
          provide: EnvironmentService,
          useValue: {
            externalLinks: {
              help: ''
            }
          }
        },
        {
          provide: HelpService,
          useValue: {
            getSectionHelp: jasmine.createSpy('getSectionHelp').and.returnValue('')
          }
        },
        {
          provide: ORDER_COMMAND_SERVICE_TOKEN,
          useValue: {
            getOrdersConfig: jasmine.createSpy('getOrdersConfig').and.returnValue({})
          }
        },
        {
          provide: PUSH_NOTIFICATIONS_CONFIG,
          useValue: {
            priceChangeNotifications: {
              isSupported: true
            },
            portfolioOrdersExecuteNotifications: {
              isSupported: true
            }
          }
        }
      ]
    });
    fixture = TestBed.createComponent(OrdersDialogWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
