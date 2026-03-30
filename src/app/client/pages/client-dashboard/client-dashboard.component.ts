import { Component, OnInit, inject } from '@angular/core';
import {NzContentComponent, NzHeaderComponent, NzLayoutComponent} from "ng-zorro-antd/layout";
import {ClientNavbarComponent} from "../../components/client-navbar/client-navbar.component";
import {
  SettingsLoadErrorDialogComponent
} from "../../../modules/dashboard/components/settings-load-error-dialog/settings-load-error-dialog.component";
import {ACTIONS_CONTEXT, ActionsContext} from "../../../shared/services/actions-context";
import {Store} from "@ngrx/store";
import {OnboardingService} from "../../../modules/dashboard/services/onboarding.service";
import {DeviceService} from "../../../shared/services/device.service";
import {Router} from "@angular/router";
import {DesktopSettingsBrokerService} from "../../../modules/dashboard/services/desktop-settings-broker.service";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {take} from "rxjs";
import {InstrumentKey} from "../../../shared/models/instruments/instrument-key.model";
import {PortfoliosInternalActions} from "../../../store/portfolios/portfolios.actions";
import {WidgetsLocalStateInternalActions} from "../../../store/widgets-local-state/widgets-local-state.actions";
import {LocalStorageCommonConstants} from "../../../shared/constants/local-storage.constants";
import {
  TerminalSettingsWidgetComponent
} from "../../../modules/terminal-settings/widgets/terminal-settings-widget/terminal-settings-widget.component";
import {
  WatchlistCollectionBrokerService
} from "../../../modules/instruments/services/watchlist-collection-broker.service";
import { EXPORT_SETTINGS_SERVICE_TOKEN } from "../../../shared/services/settings/export-settings.service";
import { ExportDesktopSettingsService } from "../../../shared/services/settings/export-desktop-settings.service";
import { InstrumentSelectDialogWidgetComponent } from "../../../modules/instruments/widgets/instrument-select-dialog-widget/instrument-select-dialog-widget.component";
import {GraphStorageService} from "../../../modules/ai-graph/services/graph-storage.service";
import { UrgentNotificationDialogComponent } from "../../../modules/urgent-notifications/components/urgent-notification-dialog/urgent-notification-dialog.component";
import { FeedbackWidgetComponent } from '../../../modules/feedback/widgets/feedback-widget/feedback-widget.component';
import {DashboardComponent} from "../../../modules/dashboard/components/dashboard/dashboard.component";
import {
  OrdersDialogWidgetComponent
} from "../../../modules/order-commands/widgets/orders-dialog-widget/orders-dialog-widget.component";
import {
  EditOrderDialogWidgetComponent
} from "../../../modules/order-commands/widgets/edit-order-dialog-widget/edit-order-dialog-widget.component";
import {
  ApplicationUpdatedWidgetComponent
} from "../../../modules/application-meta/widgets/application-updated-widget/application-updated-widget.component";

@Component({
    selector: 'ats-client-dashboard',
  imports: [
    NzContentComponent,
    NzHeaderComponent,
    NzLayoutComponent,
    ClientNavbarComponent,
    FeedbackWidgetComponent,
    SettingsLoadErrorDialogComponent,
    TerminalSettingsWidgetComponent,
    InstrumentSelectDialogWidgetComponent,
    UrgentNotificationDialogComponent,
    DashboardComponent,
    OrdersDialogWidgetComponent,
    EditOrderDialogWidgetComponent,
    ApplicationUpdatedWidgetComponent
  ],
    templateUrl: './client-dashboard.component.html',
    styleUrl: './client-dashboard.component.less',
    providers: [
        {
            provide: ACTIONS_CONTEXT,
            useExisting: ClientDashboardComponent
        },
        {
            provide: EXPORT_SETTINGS_SERVICE_TOKEN,
            useClass: ExportDesktopSettingsService
        }
    ]
})
export class ClientDashboardComponent implements OnInit, ActionsContext {
  private readonly store = inject(Store);
  private readonly onboarding = inject(OnboardingService);
  private readonly deviceService = inject(DeviceService);
  private readonly router = inject(Router);
  private readonly desktopSettingsBrokerService = inject(DesktopSettingsBrokerService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly watchlistCollectionBrokerService = inject(WatchlistCollectionBrokerService);
  private readonly graphStorageService = inject(GraphStorageService);

  showSettingsLoadDialog = false;

  ngOnInit(): void {
    this.watchlistCollectionBrokerService.setConfig({
      enableStore: true
    });
    this.graphStorageService.setConfig({
      storageType: 'local'
    });

    this.deviceService.deviceInfo$
      .pipe(take(1))
      .subscribe(info => {
        if (info.isMobile) {
          this.router.navigate(['./mobile']);
          return;
        }

        this.initDashboard();
      });
  }

  selectInstrument(instrumentKey: InstrumentKey, groupKey: string): void {
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, groupKey);
  }

  private initDashboard(): void {
    this.desktopSettingsBrokerService.initSettingsBrokers({
      onSettingsReadError: () => this.showSettingsLoadDialog = true
    });

    this.store.dispatch(PortfoliosInternalActions.init());
    this.store.dispatch(WidgetsLocalStateInternalActions.init({storageKey: LocalStorageCommonConstants.WidgetsLocalStateStorageKey}));
    this.onboarding.start();
  }
}
