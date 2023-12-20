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
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";

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
            instrumentsSelection$: of({}),
            selectedPortfolio$: of({})
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OrdersBasketWidgetComponent);
    component = fixture.componentInstance;

    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {} as WidgetMeta
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
