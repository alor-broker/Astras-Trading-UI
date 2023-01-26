import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrdersBasketWidgetComponent } from './orders-basket-widget.component';
import {
  mockComponent,
  widgetSkeletonMock
} from '../../../../shared/utils/testing';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';

describe('OrdersBasketWidgetComponent', () => {
  let component: OrdersBasketWidgetComponent;
  let fixture: ComponentFixture<OrdersBasketWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrdersBasketWidgetComponent,
        mockComponent({ selector: 'ats-orders-basket', inputs: ['guid'] }),
        widgetSkeletonMock
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            addSettings: jasmine.createSpy('addSettings').and.callThrough()
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            terminalSettingsService: of({})
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: of({})
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OrdersBasketWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
