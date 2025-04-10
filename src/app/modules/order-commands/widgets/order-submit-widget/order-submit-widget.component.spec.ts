import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderSubmitWidgetComponent } from './order-submit-widget.component';
import {Subject} from "rxjs";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {CommonParametersService} from "../../services/common-parameters.service";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import { WidgetsSharedDataService } from "../../../../shared/services/widgets-shared-data.service";
import { ORDER_COMMAND_SERVICE_TOKEN } from "../../../../shared/services/orders/order-command.service";
import {PUSH_NOTIFICATIONS_CONFIG} from "../../../push-notifications/services/push-notifications-config";
import {MockProvider} from "ng-mocks";
import {ConfirmableOrderCommandsService} from "../../services/confirmable-order-commands.service";

describe('OrderSubmitWidgetComponent', () => {
  let component: OrderSubmitWidgetComponent;
  let fixture: ComponentFixture<OrderSubmitWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderSubmitWidgetComponent],
      providers: [
          MockProvider(
            WidgetSettingsService,
            {
              getSettings: jasmine.createSpy('getSettings ').and.returnValue(new Subject()),
              getSettingsOrNull: jasmine.createSpy('getSettingsOrNull ').and.returnValue(new Subject())
            }
          ),
        MockProvider(
          DashboardContextService,
          {
            selectedPortfolio$: new Subject(),
          }
        ),
        MockProvider(
          TerminalSettingsService,
          {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        ),
        MockProvider(
          InstrumentsService,
          {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(new Subject())
          }
        ),
        MockProvider(
          CommonParametersService,
          {
            setParameters: jasmine.createSpy('setParameters').and.callThrough()
          }
        ),
        MockProvider(ConfirmableOrderCommandsService),
        {
          provide: WidgetsSharedDataService,
          useValue: {
            getDataProvideValues: jasmine.createSpy('getDataProvideValues').and.returnValue(new Subject())
          }
        },
        MockProvider(
          ORDER_COMMAND_SERVICE_TOKEN,
          {
            getOrdersConfig: jasmine.createSpy('getOrdersConfig').and.returnValue({ })
          }
        ),
        MockProvider(
          PUSH_NOTIFICATIONS_CONFIG,
          {
            priceChangeNotifications: {
              isSupported: true
            },

            portfolioOrdersExecuteNotifications: {
              isSupported: true
            }
          }
        )
      ]
    });
    fixture = TestBed.createComponent(OrderSubmitWidgetComponent);
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
