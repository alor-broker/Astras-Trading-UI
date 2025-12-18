import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MobileDashboardComponent} from './mobile-dashboard.component';
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {MobileDashboardFeature} from "../../../store/mobile-dashboard/mobile-dashboard.reducer";
import {ACTIONS_CONTEXT} from "../../../shared/services/actions-context";
import {commonTestProviders} from "../../../shared/utils/testing/common-test-providers";
import {MockComponents, MockProvider} from "ng-mocks";
import {MobileNavbarComponent} from "../../components/mobile-navbar/mobile-navbar.component";
import {
  MobileInstrumentsHistoryComponent
} from "../../components/mobile-instruments-history/mobile-instruments-history.component";
import {
  EmptyPortfoliosWarningModalComponent
} from "../../components/empty-portfolios-warning-modal/empty-portfolios-warning-modal.component";
import {
  MobileDashboardContentComponent
} from "../../components/mobile-dashboard-content/mobile-dashboard-content.component";
import {
  TerminalSettingsWidgetComponent
} from "../../../modules/terminal-settings/widgets/terminal-settings-widget/terminal-settings-widget.component";
import {MobileSettingsBrokerService} from "../../../modules/dashboard/services/mobile-settings-broker.service";
import {
  UrgentNotificationDialogComponent
} from "../../../modules/urgent-notifications/components/urgent-notification-dialog/urgent-notification-dialog.component";
import {
  EditOrderDialogWidgetComponent
} from "../../../modules/order-commands/widgets/edit-order-dialog-widget/edit-order-dialog-widget.component";
import {
  ApplicationUpdatedWidgetComponent
} from "../../../modules/application-meta/widgets/application-updated-widget/application-updated-widget.component";

describe('MobileDashboardComponent', () => {
  let component: MobileDashboardComponent;
  let fixture: ComponentFixture<MobileDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MobileDashboardComponent,
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(MobileDashboardFeature),
        MockComponents(
          MobileNavbarComponent,
          MobileInstrumentsHistoryComponent,
          EmptyPortfoliosWarningModalComponent,
          MobileDashboardContentComponent,
          TerminalSettingsWidgetComponent,
          UrgentNotificationDialogComponent,
          EditOrderDialogWidgetComponent,
          ApplicationUpdatedWidgetComponent
        )
      ],
      providers: [
        MockProvider(
          ACTIONS_CONTEXT,
          {
            selectInstrument: jasmine.createSpy('selectInstrument').and.callThrough()
          }
        ),
        MockProvider(MobileSettingsBrokerService),
        ...commonTestProviders
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MobileDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
