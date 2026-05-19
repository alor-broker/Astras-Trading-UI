import {
  ChangeDetectionStrategy,
  Component,
  inject,
  InjectionToken,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {ClientAuthService} from '@terminal-core-lib/features/user-context/client/services/client-auth.service';
import {ACTIONS_CONTEXT,} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {GlobalLoadingIndicatorService} from '@terminal-core-lib/common/services/global-loading-indicator.service';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {Hook} from '@terminal-core-lib/common/types/hook.types';
import {
  fromEvent,
  map,
  Observable,
  startWith,
  take
} from 'rxjs';
import {LocalStorageCommonConstants} from '@terminal-core-lib/features/local-storage/local-storage.constants';
import {MobileActionsContextService} from "../../services/mobile-actions-context.service";
import {SettingsBrokerService} from '../../settings-brokers/settings-broker.service';
import {WidgetLocalStateService} from '@terminal-core-lib/features/widget-local-state/widget-local-state.service';
import {AccountService} from '@terminal-core-lib/features/client-info/services/account-service';
import {AllPositionsService} from '@terminal-core-lib/features/client-info/services/all-positions.service';
import {PortfoliosStoreFacade} from '@terminal-core-lib/features/portfolios/store/portfolios-store-facade';
import {UserPortfoliosHelper} from '@terminal-core-lib/features/portfolios/utils/user-portfolios.helper';
import {NzConfigService} from 'ng-zorro-antd/core/config';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {AsyncPipe} from '@angular/common';
import {NzLayoutComponent} from 'ng-zorro-antd/layout';
import {UrgentNotificationDialogComponent} from '@terminal-core-lib/features/urgent-notifications/components/urgent-notification-dialog/urgent-notification-dialog';
import {OrderEditDialogWidget} from '@terminal-widgets-lib/widgets/order-commands/widgets/order-edit-dialog-widget/order-edit-dialog-widget';
import {ApplicationUpdatedWidgetComponent} from '@terminal-core-lib/features/app-releases/components/application-updated-dialog/application-updated-dialog';
import {FeedbackDialog} from '@terminal-core-lib/features/feedback/components/feedback-dialog/feedback-dialog';
import {Navbar} from '../../components/navbar/navbar';
import {InstrumentsHistory} from '../../components/instruments-history/instruments-history';
import {DashboardContent} from '../../components/dashboard-content/dashboard-content';

const PAGE_HOOK = new InjectionToken<Hook[]>('PAGE_HOOK');

@Component({
  selector: 'atsm-dashboard-page',
  imports: [
    AsyncPipe,
    NzLayoutComponent,
    UrgentNotificationDialogComponent,
    OrderEditDialogWidget,
    ApplicationUpdatedWidgetComponent,
    FeedbackDialog,
    Navbar,
    InstrumentsHistory,
    DashboardContent
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    SettingsBrokerService,
    MobileActionsContextService,
    {
      provide: ACTIONS_CONTEXT,
      useExisting: MobileActionsContextService
    },
  ]
})
export class DashboardPage implements OnInit, OnDestroy {
  protected screenHeight$!: Observable<number>;

  private readonly clientAuthService = inject(ClientAuthService);

  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);

  private readonly settingsBrokerService = inject(SettingsBrokerService);

  private readonly widgetLocalStateService = inject(WidgetLocalStateService);

  private readonly accountService = inject(AccountService);

  private readonly allPositionsService = inject(AllPositionsService);

  private readonly portfoliosStoreFacade = inject(PortfoliosStoreFacade);

  private readonly loadingId = GuidGenerator.newGuid();

  private readonly pageHooks = inject(PAGE_HOOK, {optional: true});

  private readonly nzConfigService = inject(NzConfigService);

  private readonly ordersDialogService = inject(OrdersDialogService);

  ngOnDestroy(): void {
    this.destroyHooks();
  }

  ngOnInit(): void {
    this.globalLoadingIndicatorService.registerLoading(this.loadingId);

    this.clientAuthService.checkAccess().pipe(
      take(1)
    ).subscribe(result => {
      if (result) {
        this.initAfterAuth();
      }
    });
  }

  private initAfterAuth(): void {
    this.nzConfigService.set(
      'select',
      {
        nzOptionHeightPx: 35
      }
    );

    this.widgetLocalStateService.init({
      storageKey: LocalStorageCommonConstants.WidgetsLocalStateStorageKey
    });

    this.screenHeight$ = fromEvent(window, 'resize')
      .pipe(
        map(() => (window.screen.height / window.devicePixelRatio)),
        startWith(window.screen.height / window.devicePixelRatio)
      );

    this.ordersDialogService.setDialogOptions({
      isNewOrderDialogSupported: false
    });

    this.loadPortfolios(() => {
      this.settingsBrokerService.initSettingsBrokers();
      this.executePageHooks();
      this.globalLoadingIndicatorService.releaseLoading(this.loadingId);
    });
  }

  private loadPortfolios(onComplete: () => void): void {
    UserPortfoliosHelper.loadActiveUserPortfolios(
      this.accountService,
      this.allPositionsService
    ).pipe(
      take(1)
    ).subscribe(result => {
      if (result != null) {
        this.portfoliosStoreFacade.init(result);
      }
      onComplete();
    });
  }

  private executePageHooks(): void {
    (this.pageHooks ?? []).forEach(x => {
      x.onInit();
    });
  }

  private destroyHooks(): void {
    (this.pageHooks ?? []).forEach(x => {
      x.onDestroy();
    });
  }
}
