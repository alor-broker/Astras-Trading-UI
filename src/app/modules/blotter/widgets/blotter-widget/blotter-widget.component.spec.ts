import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BlotterWidgetComponent} from './blotter-widget.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {EMPTY, of} from "rxjs";
import {Store} from "@ngrx/store";
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {BlotterSettings} from '../../models/blotter-settings.model';
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {PUSH_NOTIFICATIONS_CONFIG} from "../../../push-notifications/services/push-notifications-config";
import {NavigationStackService} from "../../../../shared/services/navigation-stack.service";
import {MockComponents, MockDirectives} from "ng-mocks";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {NzTabComponent, NzTabDirective, NzTabsComponent} from "ng-zorro-antd/tabs";
import {CommonSummaryComponent} from "../../components/common-summary/common-summary.component";
import {ForwardSummaryComponent} from "../../components/forward-summary/forward-summary.component";
import {OrdersComponent} from "../../components/orders/orders.component";
import {StopOrdersComponent} from "../../components/stop-orders/stop-orders.component";
import {PositionsComponent} from "../../components/positions/positions.component";
import {TradesComponent} from "../../components/trades/trades.component";
import {RepoTradesComponent} from "../../components/repo-trades/repo-trades.component";
import {TradesHistoryComponent} from "../../components/trades-history/trades-history.component";
import {PushNotificationsComponent} from "../../components/push-notifications/push-notifications.component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {BlotterSettingsComponent} from "../../components/blotter-settings/blotter-settings.component";
import {OrdersGroupModalWidgetComponent} from "../orders-group-modal-widget/orders-group-modal-widget.component";

describe('BlotterWidgetComponent', () => {
  let component: BlotterWidgetComponent;
  let fixture: ComponentFixture<BlotterWidgetComponent>;

  let widgetSettingsServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    widgetSettingsServiceSpy = jasmine.createSpyObj('WidgetSettingsService', ['getSettings', 'getSettingsOrNull', 'addSettings']);
    widgetSettingsServiceSpy.getSettings.and.returnValue(of({activeTabIndex: 0} as BlotterSettings));
    widgetSettingsServiceSpy.getSettingsOrNull.and.returnValue(of(null));
    widgetSettingsServiceSpy.addSettings.and.callThrough();

    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        BlotterWidgetComponent,
        MockComponents(
          WidgetSkeletonComponent,
          WidgetHeaderComponent,
          NzTabsComponent,
          NzTabComponent,
          CommonSummaryComponent,
          ForwardSummaryComponent,
          OrdersComponent,
          StopOrdersComponent,
          PositionsComponent,
          TradesComponent,
          RepoTradesComponent,
          TradesHistoryComponent,
          PushNotificationsComponent,
          BlotterSettingsComponent,
          OrdersGroupModalWidgetComponent
        ),
        MockDirectives(
          NzResizeObserverDirective,
          NzTabDirective,
          NzIconDirective
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettingsOrNull: of(null),
            getSettings: of({}),
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
            selectedPortfolio$: of({})
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
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedPortfolio$: of({})
          }
        },
        {
          provide: NavigationStackService,
          useValue: {
            currentState$: EMPTY
          }
        }
      ]
    }).compileComponents();

    TestBed.overrideComponent(BlotterWidgetComponent, {
      set: {
        providers: [
          {provide: WidgetSettingsService, useValue: widgetSettingsServiceSpy},
          {
            provide: Store,
            useValue: {
              select: jasmine.createSpy('select').and.returnValue(of({}))
            }
          }
        ]
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlotterWidgetComponent);
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

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
