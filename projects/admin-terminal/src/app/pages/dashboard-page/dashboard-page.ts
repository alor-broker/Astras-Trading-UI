import {
  ChangeDetectionStrategy,
  Component,
  inject,
  InjectionToken,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {take} from 'rxjs';
import {
  NzContentComponent,
  NzHeaderComponent,
  NzLayoutComponent
} from 'ng-zorro-antd/layout';
import {Navbar} from '../../components/navbar/navbar';
import {SettingsBrokerService} from '../../settings-brokers/settings-broker.service';
import {WidgetLocalStateService} from '@terminal-core-lib/features/widget-local-state/widget-local-state.service';
import {LocalStorageAdminConstants,} from '@terminal-core-lib/features/local-storage/local-storage.constants';
import {WatchlistCollectionBrokerService} from '@terminal-core-lib/features/watchlist/services/watchlist-collection-broker.service';
import {GlobalLoadingIndicatorService} from '@terminal-core-lib/common/services/global-loading-indicator.service';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {Hook} from '@terminal-core-lib/common/types/hook.types';
import {CustomizableDashboard} from '@terminal-core-lib/features/dashboard/desktop/components/customizable-dashboard/customizable-dashboard';
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {DesktopDashboardContextService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-dashboard-context.service';
import {OrderSubmitDialogWidget} from '@terminal-widgets-lib/widgets/order-commands/widgets/order-submit-dialog-widget/order-submit-dialog-widget';
import {OrderEditDialogWidget} from '@terminal-widgets-lib/widgets/order-commands/widgets/order-edit-dialog-widget/order-edit-dialog-widget';

import {LoggingHook} from '@terminal-core-lib/features/logging/hooks/logging-hook';
import {TranslationHook} from '@terminal-core-lib/features/translations/hooks/translation-hook';
import {CleanDirtySettingsHook} from '@terminal-core-lib/features/widget-settings/hooks/clean-dirty-settings-hook';
import {AdminAuthService} from '../../services/admin-auth.service';

const PAGE_HOOK = new InjectionToken<Hook[]>('PAGE_HOOK');

@Component({
  selector: 'atsd-dashboard-page',
  imports: [
    NzLayoutComponent,
    NzHeaderComponent,
    NzContentComponent,
    Navbar,
    CustomizableDashboard,
    OrderSubmitDialogWidget,
    OrderEditDialogWidget
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.less',
  providers: [
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
  private readonly authService = inject(AdminAuthService);

  private readonly settingsBrokerService = inject(SettingsBrokerService);

  private readonly widgetLocalStateService = inject(WidgetLocalStateService);

  private readonly watchlistCollectionBrokerService = inject(WatchlistCollectionBrokerService);

  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);

  private readonly loadingId = GuidGenerator.newGuid();

  private readonly pageHooks = inject(PAGE_HOOK, {optional: true});

  private readonly dashboardContextService = inject(DesktopDashboardContextService);

  selectInstrument(instrumentKey: InstrumentKey, groupKey: string): void {
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, groupKey);
  }

  ngOnDestroy(): void {
    this.destroyHooks();
  }

  ngOnInit(): void {
    this.globalLoadingIndicatorService.registerLoading(this.loadingId);

    this.authService.checkAccess().pipe(
      take(1)
    ).subscribe(result => {
      if (result) {
        this.initAfterAuth();
      } else {
        this.globalLoadingIndicatorService.releaseLoading(this.loadingId);
      }
    });
  }

  private initAfterAuth(): void {
    this.watchlistCollectionBrokerService.setConfig({
      enableStore: false
    });

    this.widgetLocalStateService.init({
      storageKey: LocalStorageAdminConstants.WidgetsLocalStateStorageKey
    });

    this.settingsBrokerService.initSettingsBrokers();
    this.executePageHooks();
    this.globalLoadingIndicatorService.releaseLoading(this.loadingId);
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
