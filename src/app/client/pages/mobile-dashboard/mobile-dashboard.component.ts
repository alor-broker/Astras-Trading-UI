import {Component, OnInit} from '@angular/core';
import {MobileActionsContextService} from "../../../modules/dashboard/services/mobile-actions-context.service";
import {ACTIONS_CONTEXT} from "../../../shared/services/actions-context";
import {fromEvent, Observable} from "rxjs";
import {MobileSettingsBrokerService} from "../../../modules/dashboard/services/mobile-settings-broker.service";
import {Store} from "@ngrx/store";
import {PortfoliosInternalActions} from "../../../store/portfolios/portfolios.actions";
import {WidgetsLocalStateInternalActions} from "../../../store/widgets-local-state/widgets-local-state.actions";
import {LocalStorageCommonConstants} from "../../../shared/constants/local-storage.constants";
import {map, startWith} from "rxjs/operators";
import {NzLayoutComponent} from "ng-zorro-antd/layout";
import {AsyncPipe, NgIf} from "@angular/common";
import {DashboardModule} from "../../../modules/dashboard/dashboard.module";
import {TerminalSettingsModule} from "../../../modules/terminal-settings/terminal-settings.module";
import {FeedbackModule} from "../../../modules/feedback/feedback.module";
import {ApplicationMetaModule} from "../../../modules/application-meta/application-meta.module";
import {OrderCommandsModule} from "../../../modules/order-commands/order-commands.module";
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

@Component({
  selector: 'ats-mobile-dashboard',
  standalone: true,
  imports: [
    NzLayoutComponent,
    NgIf,
    AsyncPipe,
    DashboardModule,
    TerminalSettingsModule,
    FeedbackModule,
    ApplicationMetaModule,
    OrderCommandsModule,
    MobileNavbarComponent,
    MobileInstrumentsHistoryComponent,
    EmptyPortfoliosWarningModalComponent,
    MobileDashboardContentComponent,
    TerminalSettingsWidgetComponent
  ],
  templateUrl: './mobile-dashboard.component.html',
  styleUrl: './mobile-dashboard.component.less',
  providers: [
    MobileActionsContextService,
    {
      provide: ACTIONS_CONTEXT,
      useExisting: MobileActionsContextService
    }
  ]
})
export class MobileDashboardComponent implements OnInit {
  screenHeight!: Observable<number>;

  constructor(
    private readonly mobileSettingsBrokerService: MobileSettingsBrokerService,
    private readonly store: Store
  ) {
  }

  ngOnInit(): void {
    this.mobileSettingsBrokerService.initSettingsBrokers();
    this.store.dispatch(PortfoliosInternalActions.init());
    this.store.dispatch(WidgetsLocalStateInternalActions.init({storageKey: LocalStorageCommonConstants.WidgetsLocalStateStorageKey}));

    this.screenHeight = fromEvent(window, 'resize')
      .pipe(
        map(() => (window.screen.height / window.devicePixelRatio)),
        startWith(window.screen.height / window.devicePixelRatio)
      );
  }
}
