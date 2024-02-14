import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrdersDialogWidgetComponent} from './orders-dialog-widget.component';
import {BehaviorSubject, Subject} from "rxjs";
import {ModalService} from "../../../../shared/services/modal.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {
  getTranslocoModule,
  mockComponent
} from "../../../../shared/utils/testing";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import { EnvironmentService } from "../../../../shared/services/environment.service";
import { HelpService } from "../../../../shared/services/help.service";

describe('OrdersDialogWidgetComponent', () => {
  let component: OrdersDialogWidgetComponent;
  let fixture: ComponentFixture<OrdersDialogWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[getTranslocoModule()],
      declarations: [
        OrdersDialogWidgetComponent,
        mockComponent({
          selector: 'ats-instrument-info',
          inputs: ['currentPortfolio', 'instrumentKey']
        }),
        mockComponent({
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
