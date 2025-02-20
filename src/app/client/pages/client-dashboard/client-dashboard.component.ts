import {Component, OnInit} from '@angular/core';
import {DashboardModule} from "../../../modules/dashboard/dashboard.module";
import {NzContentComponent, NzHeaderComponent, NzLayoutComponent} from "ng-zorro-antd/layout";
import {TerminalSettingsModule} from "../../../modules/terminal-settings/terminal-settings.module";
import {ClientNavbarComponent} from "../../components/client-navbar/client-navbar.component";
import {FeedbackModule} from "../../../modules/feedback/feedback.module";
import {ApplicationMetaModule} from "../../../modules/application-meta/application-meta.module";
import {OrderCommandsModule} from "../../../modules/order-commands/order-commands.module";
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

@Component({
  selector: 'ats-client-dashboard',
  standalone: true,
  imports: [
    DashboardModule,
    NzContentComponent,
    NzHeaderComponent,
    NzLayoutComponent,
    TerminalSettingsModule,
    ClientNavbarComponent,
    FeedbackModule,
    ApplicationMetaModule,
    OrderCommandsModule,
    SettingsLoadErrorDialogComponent,
    TerminalSettingsWidgetComponent,
    InstrumentSelectDialogWidgetComponent
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
  showSettingsLoadDialog = false;

  constructor(
    private readonly store: Store,
    private readonly onboarding: OnboardingService,
    private readonly deviceService: DeviceService,
    private readonly router: Router,
    private readonly desktopSettingsBrokerService: DesktopSettingsBrokerService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly watchlistCollectionBrokerService: WatchlistCollectionBrokerService
  ) {
  }

  ngOnInit(): void {
    this.watchlistCollectionBrokerService.setConfig({
      enableStore: true
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

  openChart(): void {
    return;
  }
}
