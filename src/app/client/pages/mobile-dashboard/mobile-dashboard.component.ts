import {Component, inject, OnInit} from '@angular/core';
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
import {AsyncPipe} from "@angular/common";
import {MobileNavbarComponent} from "../../components/mobile-navbar/mobile-navbar.component";
import {
  MobileInstrumentsHistoryComponent
} from "../../components/mobile-instruments-history/mobile-instruments-history.component";
import {
  MobileDashboardContentComponent
} from "../../components/mobile-dashboard-content/mobile-dashboard-content.component";
import {
  TerminalSettingsWidgetComponent
} from "../../../modules/terminal-settings/widgets/terminal-settings-widget/terminal-settings-widget.component";
import {EXPORT_SETTINGS_SERVICE_TOKEN} from "../../../shared/services/settings/export-settings.service";
import {ExportMobileSettingsService} from "../../../shared/services/settings/export-mobile-settings.service";
import {
  UrgentNotificationDialogComponent
} from "../../../modules/urgent-notifications/components/urgent-notification-dialog/urgent-notification-dialog.component";
import {FeedbackWidgetComponent} from '../../../modules/feedback/widgets/feedback-widget/feedback-widget.component';
import {
  EditOrderDialogWidgetComponent
} from "../../../modules/order-commands/widgets/edit-order-dialog-widget/edit-order-dialog-widget.component";
import {
  ApplicationUpdatedWidgetComponent
} from "../../../modules/application-meta/widgets/application-updated-widget/application-updated-widget.component";
import {OrdersDialogService} from "../../../shared/services/orders/orders-dialog.service";

@Component({
  selector: 'ats-mobile-dashboard',
  imports: [
    NzLayoutComponent,
    AsyncPipe,
    FeedbackWidgetComponent,
    MobileNavbarComponent,
    MobileInstrumentsHistoryComponent,
    MobileDashboardContentComponent,
    TerminalSettingsWidgetComponent,
    UrgentNotificationDialogComponent,
    EditOrderDialogWidgetComponent,
    ApplicationUpdatedWidgetComponent
  ],
  templateUrl: './mobile-dashboard.component.html',
  styleUrl: './mobile-dashboard.component.less',
  providers: [
    MobileActionsContextService,
    {
      provide: ACTIONS_CONTEXT,
      useExisting: MobileActionsContextService
    },
    {
      provide: EXPORT_SETTINGS_SERVICE_TOKEN,
      useClass: ExportMobileSettingsService
    }
  ]
})
export class MobileDashboardComponent implements OnInit {
  screenHeight!: Observable<number>;

  private readonly mobileSettingsBrokerService = inject(MobileSettingsBrokerService);

  private readonly ordersDialogService = inject(OrdersDialogService);

  private readonly store = inject(Store);

  ngOnInit(): void {
    this.mobileSettingsBrokerService.initSettingsBrokers();
    this.store.dispatch(PortfoliosInternalActions.init());
    this.store.dispatch(WidgetsLocalStateInternalActions.init({storageKey: LocalStorageCommonConstants.WidgetsLocalStateStorageKey}));

    this.screenHeight = fromEvent(window, 'resize')
      .pipe(
        map(() => (window.screen.height / window.devicePixelRatio)),
        startWith(window.screen.height / window.devicePixelRatio)
      );

    this.ordersDialogService.setDialogOptions({
      isNewOrderDialogSupported: false
    });
  }
}
