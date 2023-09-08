import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrdersDialogWidgetComponent} from './orders-dialog-widget.component';
import {BehaviorSubject, Subject} from "rxjs";
import {ModalService} from "../../../../shared/services/modal.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {mockComponent} from "../../../../shared/utils/testing";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";

describe('OrdersDialogWidgetComponent', () => {
  let component: OrdersDialogWidgetComponent;
  let fixture: ComponentFixture<OrdersDialogWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
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
