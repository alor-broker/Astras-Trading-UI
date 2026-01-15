import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OrderSubmitWidgetComponent} from './order-submit-widget.component';
import {Subject} from "rxjs";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {CommonParametersService} from "../../services/common-parameters.service";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {WidgetsSharedDataService} from "../../../../shared/services/widgets-shared-data.service";
import {ORDER_COMMAND_SERVICE_TOKEN} from "../../../../shared/services/orders/order-command.service";
import {PUSH_NOTIFICATIONS_CONFIG} from "../../../push-notifications/services/push-notifications-config";
import {MockComponents, MockDirectives, MockProvider} from "ng-mocks";
import {ConfirmableOrderCommandsService} from "../../services/confirmable-order-commands.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {
  WidgetHeaderInstrumentSwitchComponent
} from "../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component";
import {CompactHeaderComponent} from "../../components/compact-header/compact-header.component";
import {NzTabComponent, NzTabsComponent} from "ng-zorro-antd/tabs";
import {WorkingVolumesComponent} from "../../components/working-volumes/working-volumes.component";
import {LimitOrderFormComponent} from "../../components/order-forms/limit-order-form/limit-order-form.component";
import {
  LimitOrderPriceChangeComponent
} from "../../components/limit-order-price-change/limit-order-price-change.component";
import {MarketOrderFormComponent} from "../../components/order-forms/market-order-form/market-order-form.component";
import {StopOrderFormComponent} from "../../components/order-forms/stop-order-form/stop-order-form.component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {
  SetupInstrumentNotificationsComponent
} from "../../../push-notifications/components/setup-instrument-notifications/setup-instrument-notifications.component";
import {OrderSubmitSettingsComponent} from "../../components/order-submit-settings/order-submit-settings.component";

describe('OrderSubmitWidgetComponent', () => {
  let component: OrderSubmitWidgetComponent;
  let fixture: ComponentFixture<OrderSubmitWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        OrderSubmitWidgetComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          WidgetSkeletonComponent,
          WidgetHeaderComponent,
          WidgetHeaderInstrumentSwitchComponent,
          CompactHeaderComponent,
          NzTabsComponent,
          NzTabComponent,
          WorkingVolumesComponent,
          LimitOrderFormComponent,
          LimitOrderPriceChangeComponent,
          MarketOrderFormComponent,
          StopOrderFormComponent,
          SetupInstrumentNotificationsComponent,
          OrderSubmitSettingsComponent,
        ),
        MockDirectives(
          NzIconDirective
        )
      ],
      providers: [
        MockProvider(WidgetSettingsService, {
          getSettings: jasmine.createSpy('getSettings ').and.returnValue(new Subject()),
          getSettingsOrNull: jasmine.createSpy('getSettingsOrNull ').and.returnValue(new Subject())
        }),
        MockProvider(DashboardContextService, {
          selectedPortfolio$: new Subject(),
        }),
        MockProvider(TerminalSettingsService, {
          getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
        }),
        MockProvider(InstrumentsService, {
          getInstrument: jasmine.createSpy('getInstrument').and.returnValue(new Subject())
        }),
        MockProvider(CommonParametersService, {
          setParameters: jasmine.createSpy('setParameters').and.callThrough()
        }),
        MockProvider(ConfirmableOrderCommandsService),
        {
          provide: WidgetsSharedDataService,
          useValue: {
            getDataProvideValues: jasmine.createSpy('getDataProvideValues').and.returnValue(new Subject())
          }
        },
        MockProvider(ORDER_COMMAND_SERVICE_TOKEN, {
          getOrdersConfig: jasmine.createSpy('getOrdersConfig').and.returnValue({})
        }),
        MockProvider(PUSH_NOTIFICATIONS_CONFIG, {
          priceChangeNotifications: {
            isSupported: true
          },
          portfolioOrdersExecuteNotifications: {
            isSupported: true
          }
        })
      ]
    });
    fixture = TestBed.createComponent(OrderSubmitWidgetComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'widgetInstance',
      {
        instance: {
          guid: 'guid'
        } as Widget,
        widgetMeta: {widgetName: {}} as WidgetMeta
      }
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
