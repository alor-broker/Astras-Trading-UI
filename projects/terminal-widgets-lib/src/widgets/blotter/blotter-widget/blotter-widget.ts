import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {PUSH_NOTIFICATIONS_CONFIG} from "@terminal-core-lib/features/push-notifications/types/push-notifications-config.types";
import {WidgetSettingsService} from "@terminal-core-lib/features/widget-settings/services/widget-settings.service";
import {
  allNotificationsColumns,
  allOrdersColumns,
  allPositionsColumns,
  allRepoTradesColumns,
  allStopOrdersColumns,
  allTradesColumns,
  allTradesHistoryColumns,
  BlotterWidgetSettings
} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {TerminalSettingsService} from "@terminal-core-lib/features/terminal-settings/services/terminal-settings.service";
import {MarketType} from "@terminal-core-lib/common/types/portfolio.types";
import {
  ContentSize,
  WidgetInstance
} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {
  BehaviorSubject,
  Observable,
  of,
  shareReplay
} from "rxjs";
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {TableSettingHelper} from "@terminal-core-lib/features/tables/utils/table-settings.helper";
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {
  filter,
  map,
  startWith
} from 'rxjs/operators';
import {WidgetBadgeHelper} from '@terminal-widgets-lib/common/utils/widget-badge.helper';
import {PortfolioKeyHelper} from '@terminal-core-lib/common/utils/portfolio-key.helper';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NavigationStackService} from '@terminal-core-lib/common/services/navigation-stack.service';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {
  NzTabComponent,
  NzTabDirective,
  NzTabsComponent
} from 'ng-zorro-antd/tabs';
import {BlotterCommonSummary} from '@terminal-widgets-lib/widgets/blotter/components/blotter-common-summary/blotter-forward-summary';
import {BlotterForwardSummary} from '@terminal-widgets-lib/widgets/blotter/components/blotter-forward-summary/blotter-forward-summary';
import {BlotterOrders} from '@terminal-widgets-lib/widgets/blotter/components/blotter-orders/blotter-orders';
import {BlotterStopOrders} from '@terminal-widgets-lib/widgets/blotter/components/blotter-stop-orders/blotter-stop-orders';
import {BlotterPositions} from '@terminal-widgets-lib/widgets/blotter/components/blotter-positions/blotter-positions';
import {BlotterTrades} from '@terminal-widgets-lib/widgets/blotter/components/blotter-trades/blotter-trades';
import {BlotterRepoTrades} from '@terminal-widgets-lib/widgets/blotter/components/blotter-repo-trades/blotter-repo-trades';
import {BlotterTradesHistory} from '@terminal-widgets-lib/widgets/blotter/components/blotter-trades-history/blotter-trades-history';
import {BlotterPushNotifications} from '@terminal-widgets-lib/widgets/blotter/components/blotter-push-notifications/blotter-push-notifications';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {BlotterSettings} from '@terminal-widgets-lib/widgets/blotter/components/blotter-settings/blotter-settings';
import {BlotterService} from '@terminal-widgets-lib/widgets/blotter/services/blotter.service';
import {Widget} from '@terminal-widgets-lib/common/widget.base';

@Component({
  selector: 'ats-blotter-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    NzResizeObserverDirective,
    NzTabsComponent,
    NzTabComponent,
    NzTabDirective,
    BlotterCommonSummary,
    BlotterForwardSummary,
    BlotterOrders,
    BlotterStopOrders,
    BlotterPositions,
    BlotterTrades,
    BlotterRepoTrades,
    BlotterTradesHistory,
    BlotterPushNotifications,
    NzIconDirective,
    BlotterSettings
  ],
  templateUrl: './blotter-widget.html',
  styleUrl: './blotter-widget.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    BlotterService
  ]
})
export class BlotterWidget implements Widget, OnInit, OnDestroy {
  readonly isActive = input(false);

  readonly pushNotificationsConfig = inject(PUSH_NOTIFICATIONS_CONFIG);

  readonly marketTypes = MarketType;

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  activeTabIndex$ = of(0);

  marketType$?: Observable<MarketType | undefined>;

  showBadge$!: Observable<boolean>;

  settings$!: Observable<BlotterWidgetSettings>;

  contentSize$ = new BehaviorSubject<ContentSize | null>(null);

  title$!: Observable<string>;

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly navigationStackService = inject(NavigationStackService);

  private readonly destroyRef = inject(DestroyRef);

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  get isNotificationsSupported(): boolean {
    return this.pushNotificationsConfig.portfolioOrdersExecuteNotifications.isSupported
      || this.pushNotificationsConfig.priceChangeNotifications.isSupported;
  }

  ngOnInit(): void {
    WidgetSettingsFactoryHelper.createPortfolioLinkedWidgetSettingsIfMissing<BlotterWidgetSettings>(
      this.widgetInstance(),
      'BlotterSettings',
      settings => ({
        ...settings,
        showSummary: ValueHelper.getValueOrDefault(settings.showSummary, true),
        showOrders: ValueHelper.getValueOrDefault(settings.showOrders, true),
        showStopOrders: ValueHelper.getValueOrDefault(settings.showStopOrders, true),
        showPositions: ValueHelper.getValueOrDefault(settings.showPositions, true),
        showTrades: ValueHelper.getValueOrDefault(settings.showTrades, true),
        showRepoTrades: ValueHelper.getValueOrDefault(settings.showRepoTrades, false),
        showHistoryTrades: ValueHelper.getValueOrDefault(settings.showHistoryTrades, true),
        showNotifications: ValueHelper.getValueOrDefault(settings.showNotifications, true),
        tradesTable: TableSettingHelper.toTableDisplaySettings(
          settings.tradesTable,
          allTradesColumns.filter(c => c.isDefault).map(c => c.id)
        ),
        positionsTable: TableSettingHelper.toTableDisplaySettings(
          settings.positionsTable,
          allPositionsColumns.filter(c => c.isDefault).map(c => c.id)
        ),
        ordersTable: TableSettingHelper.toTableDisplaySettings(
          settings.ordersTable,
          allOrdersColumns.filter(c => c.isDefault).map(c => c.id)
        ),
        stopOrdersTable: TableSettingHelper.toTableDisplaySettings(
          settings.stopOrdersTable,
          allStopOrdersColumns.filter(c => c.isDefault).map(c => c.id)
        ),
        notificationsTable: TableSettingHelper.toTableDisplaySettings(
          settings.notificationsTable,
          allNotificationsColumns.filter(c => c.isDefault).map(c => c.id)
        ),
        repoTradesTable: TableSettingHelper.toTableDisplaySettings(
          settings.repoTradesTable,
          allRepoTradesColumns.filter(c => c.isDefault).map(c => c.id)
        ),
        tradesHistoryTable: TableSettingHelper.toTableDisplaySettings(
          settings.tradesTable,
          allTradesHistoryColumns.filter(c => c.isDefault).map(c => c.id)
        ),
        badgeColor: ValueHelper.getValueOrDefault(settings.badgeColor, DefaultBadge),
        isSoldPositionsHidden: ValueHelper.getValueOrDefault(settings.isSoldPositionsHidden, true),
        cancelOrdersWithoutConfirmation: ValueHelper.getValueOrDefault(settings.cancelOrdersWithoutConfirmation, false),
        showPositionActions: ValueHelper.getValueOrDefault(settings.showPositionActions, false),
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<BlotterWidgetSettings>(this.guid);

    this.title$ = this.settings$.pipe(
      map(s => `${s.portfolio} (${s.exchange})`),
      startWith('')
    );

    this.showBadge$ = WidgetBadgeHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);

    this.activeTabIndex$ = this.settings$.pipe(
      map(s => s.activeTabIndex)
    );

    this.marketType$ = this.settings$.pipe(
      map(s => PortfolioKeyHelper.getMarketTypeByPortfolio(s.portfolio)),
      shareReplay(1)
    );

    this.navigationStackService.currentState$.pipe(
      filter(state => state.widgetTarget.typeId === 'blotter'),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(state => {
      if (state.widgetTarget.parameters?.activeTab === 'summary') {
        this.onIndexChange(0);
      }
    });
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  onIndexChange(index?: number): void {
    this.widgetSettingsService.updateSettings<BlotterWidgetSettings>(this.guid, {activeTabIndex: index ?? 0});
  }

  ngOnDestroy(): void {
    this.contentSize$.complete();
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }
}
