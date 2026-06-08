import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  inject,
  InjectionToken,
  model,
  OnDestroy,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {ClientAuthService} from '@terminal-core-lib/features/user-context/client/services/client-auth.service';
import {
  filter,
  fromEvent,
  take
} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  NzContentComponent,
  NzHeaderComponent,
  NzLayoutComponent
} from 'ng-zorro-antd/layout';
import {Navbar} from '../../components/navbar/navbar';
import {SettingsBrokerService} from '../../settings-brokers/settings-broker.service';
import {PortfoliosStoreFacade} from '@terminal-core-lib/features/portfolios/store/portfolios-store-facade';
import {WidgetLocalStateService} from '@terminal-core-lib/features/widget-local-state/widget-local-state.service';
import {LocalStorageCommonConstants} from '@terminal-core-lib/features/local-storage/local-storage.constants';
import {WatchlistCollectionBrokerService} from '@terminal-core-lib/features/watchlist/services/watchlist-collection-broker.service';
import {GlobalLoadingIndicatorService} from '@terminal-core-lib/common/services/global-loading-indicator.service';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {AllPositionsService} from '@terminal-core-lib/features/client-info/services/all-positions.service';
import {AccountService} from '@terminal-core-lib/features/client-info/services/account-service';
import {Hook} from '@terminal-core-lib/common/types/hook.types';
import {CustomizableDashboard} from '@terminal-core-lib/features/dashboard/desktop/components/customizable-dashboard/customizable-dashboard';
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {DesktopDashboardContextService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-dashboard-context.service';
import {
  InstrumentsSearchDialog,
  SearchParameters
} from '@terminal-core-lib/features/instrument-search/components/instruments-search-dialog/instruments-search-dialog';
import {DomHelper} from '@terminal-core-lib/common/utils/dom.helper';
import {OrderSubmitDialogWidget} from '@terminal-widgets-lib/widgets/order-commands/widgets/order-submit-dialog-widget/order-submit-dialog-widget';
import {OrderEditDialogWidget} from '@terminal-widgets-lib/widgets/order-commands/widgets/order-edit-dialog-widget/order-edit-dialog-widget';

import {AppSessionTrackHook} from '@terminal-core-lib/features/session-track/hooks/app-session-track-hook';
import {LoggingHook} from '@terminal-core-lib/features/logging/hooks/logging-hook';
import {TranslationHook} from '@terminal-core-lib/features/translations/hooks/translation-hook';
import {CleanDirtySettingsHook} from '@terminal-core-lib/features/widget-settings/hooks/clean-dirty-settings-hook';
import {FeedbackDialog} from '@terminal-core-lib/features/feedback/components/feedback-dialog/feedback-dialog';
import {ApplicationUpdatedWidgetComponent} from '@terminal-core-lib/features/app-releases/components/application-updated-dialog/application-updated-dialog';
import {UrgentNotificationDialogComponent} from '@terminal-core-lib/features/urgent-notifications/components/urgent-notification-dialog/urgent-notification-dialog';
import {DashboardsSettingsBrokerService} from '../../settings-brokers/dashboards-settings-broker.service';
import {WidgetSettingsBrokerService} from '../../settings-brokers/widget-settings-broker.service';
import {TerminalSettingsBrokerService} from '../../settings-brokers/terminal-settings-broker.service';
import {ApplyFontHook} from '@terminal-core-lib/features/themes/hooks/apply-font.hook';
import {InitQueryParamsHook} from '@terminal-core-lib/common/hooks/init-query-params-hook';
import {UserPortfoliosHelper} from '@terminal-core-lib/features/portfolios/utils/user-portfolios.helper';

const PAGE_HOOK = new InjectionToken<Hook[]>('PAGE_HOOK');

@Component({
  selector: 'atsd-dashboard-page',
  imports: [
    NzLayoutComponent,
    NzHeaderComponent,
    NzContentComponent,
    Navbar,
    CustomizableDashboard,
    InstrumentsSearchDialog,
    OrderSubmitDialogWidget,
    OrderEditDialogWidget,
    FeedbackDialog,
    ApplicationUpdatedWidgetComponent,
    UrgentNotificationDialogComponent,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.less',
  providers: [
    DashboardsSettingsBrokerService,
    WidgetSettingsBrokerService,
    TerminalSettingsBrokerService,
    SettingsBrokerService,
    {
      provide: PAGE_HOOK,
      useClass: ApplyFontHook,
      multi: true
    },
    {
      provide: PAGE_HOOK,
      useClass: InitQueryParamsHook,
      multi: true
    },
    {
      provide: PAGE_HOOK,
      useClass: AppSessionTrackHook,
      multi: true
    },
    {
      provide: PAGE_HOOK,
      useClass: LoggingHook,
      multi: true
    },
    {
      provide: PAGE_HOOK,
      useClass: TranslationHook,
      multi: true
    },
    {
      provide: PAGE_HOOK,
      useClass: CleanDirtySettingsHook,
      multi: true
    },
    {
      provide: ACTIONS_CONTEXT,
      useExisting: DashboardPage
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class DashboardPage implements OnInit, OnDestroy, ActionsContext {
  protected readonly searchDialogParams = model<SearchParameters | null>(null);

  private readonly clientAuthService = inject(ClientAuthService);

  private readonly settingsBrokerService = inject(SettingsBrokerService);

  private readonly portfoliosStoreFacade = inject(PortfoliosStoreFacade);

  private readonly widgetLocalStateService = inject(WidgetLocalStateService);

  private readonly watchlistCollectionBrokerService = inject(WatchlistCollectionBrokerService);

  private readonly showSettingsLoadErrorDialog = signal(false);

  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);

  private readonly allPositionsService = inject(AllPositionsService);

  private readonly accountService = inject(AccountService);

  private readonly loadingId = GuidGenerator.newGuid();

  private readonly pageHooks = inject(PAGE_HOOK, {optional: true});

  private readonly dashboardContextService = inject(DesktopDashboardContextService);

  private readonly document = inject<Document>(DOCUMENT);

  private readonly destroyRef = inject(DestroyRef);

  selectInstrument(instrumentKey: InstrumentKey, groupKey: string): void {
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, groupKey);
  }

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
    this.watchlistCollectionBrokerService.setConfig({
      enableStore: true
    });

    this.widgetLocalStateService.init({
      storageKey: LocalStorageCommonConstants.WidgetsLocalStateStorageKey
    });

    this.loadPortfolios(() => {
      this.settingsBrokerService.initSettingsBrokers({
        onSettingsReadError: () => this.showSettingsLoadErrorDialog.set(true)
      });

      this.executePageHooks();
      this.globalLoadingIndicatorService.releaseLoading(this.loadingId);
      this.afterHooksExecuted();
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

  private afterHooksExecuted(): void {
    fromEvent<KeyboardEvent>(this.document.body, 'keydown').pipe(
      filter(() => !DomHelper.isModalOpen()),
      filter(e => e.ctrlKey && e.code === 'KeyF'),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((e) => {
      e.preventDefault();
      e.stopPropagation();
      this.searchDialogParams.set({});
    });
  }
}
