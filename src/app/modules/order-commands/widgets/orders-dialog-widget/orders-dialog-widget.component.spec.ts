import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrdersDialogWidgetComponent } from './orders-dialog-widget.component';
import {
  BehaviorSubject,
  Subject
} from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { OrdersDialogService } from "../../../../shared/services/orders/orders-dialog.service";
import { EnvironmentService } from "../../../../shared/services/environment.service";
import { HelpService } from "../../../../shared/services/help.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { ORDER_COMMAND_SERVICE_TOKEN } from "../../../../shared/services/orders/order-command.service";
import {PUSH_NOTIFICATIONS_CONFIG} from "../../../push-notifications/services/push-notifications-config";

describe('OrdersDialogWidgetComponent', () => {
  let component: OrdersDialogWidgetComponent;
  let fixture: ComponentFixture<OrdersDialogWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      declarations: [
        OrdersDialogWidgetComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-instrument-info',
          inputs: ['currentPortfolio', 'instrumentKey']
        }),
        ComponentHelpers.mockComponent({
          selector: 'ats-setup-instrument-notifications',
          inputs: ['instrumentKey', 'active', 'priceChanges'],
        })
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
            getHelpLink: jasmine.createSpy('getHelpLink').and.returnValue('')
          }
        },
        {
          provide: ORDER_COMMAND_SERVICE_TOKEN,
          useValue: {
            getOrdersConfig: jasmine.createSpy('getOrdersConfig').and.returnValue({ })
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
