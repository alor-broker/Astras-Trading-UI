import { Component, DestroyRef, input, OnDestroy, OnInit, inject } from '@angular/core';
import {BehaviorSubject, filter, Observable, of, shareReplay,} from 'rxjs';
import {map} from 'rxjs/operators';
import {BlotterService} from '../../services/blotter.service';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {MarketType} from "../../../../shared/models/portfolio-key.model";
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {TableSettingHelper} from '../../../../shared/utils/table-setting.helper';
import {defaultBadgeColor} from '../../../../shared/utils/instruments';
import {SettingsHelper} from '../../../../shared/utils/settings-helper';
import {ContentSize, WidgetInstance} from '../../../../shared/models/dashboard/dashboard-item.model';
import {
  allNotificationsColumns,
  allOrdersColumns,
  allPositionsColumns,
  allRepoTradesColumns,
  allStopOrdersColumns,
  allTradesColumns,
  allTradesHistoryColumns,
  BlotterSettings
} from '../../models/blotter-settings.model';
import {getMarketTypeByPortfolio} from "../../../../shared/utils/portfolios";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {getValueOrDefault} from "../../../../shared/utils/object-helper";
import {
  PUSH_NOTIFICATIONS_CONFIG,
  PushNotificationsConfig
} from "../../../push-notifications/services/push-notifications-config";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NavigationStackService} from "../../../../shared/services/navigation-stack.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {NzTabComponent, NzTabDirective, NzTabsComponent} from 'ng-zorro-antd/tabs';
import {CommonSummaryComponent} from '../../components/common-summary/common-summary.component';
import {ForwardSummaryComponent} from '../../components/forward-summary/forward-summary.component';
import {OrdersComponent} from '../../components/orders/orders.component';
import {StopOrdersComponent} from '../../components/stop-orders/stop-orders.component';
import {PositionsComponent} from '../../components/positions/positions.component';
import {TradesComponent} from '../../components/trades/trades.component';
import {RepoTradesComponent} from '../../components/repo-trades/repo-trades.component';
import {TradesHistoryComponent} from '../../components/trades-history/trades-history.component';
import {PushNotificationsComponent} from '../../components/push-notifications/push-notifications.component';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {BlotterSettingsComponent} from '../../components/blotter-settings/blotter-settings.component';
import {OrdersGroupModalWidgetComponent} from '../orders-group-modal-widget/orders-group-modal-widget.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-blotter-widget',
  templateUrl: './blotter-widget.component.html',
  styleUrls: ['./blotter-widget.component.less'],
  providers: [
    BlotterService
  ],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    NzResizeObserverDirective,
    NzTabsComponent,
    NzTabComponent,
    NzTabDirective,
    CommonSummaryComponent,
    ForwardSummaryComponent,
    OrdersComponent,
    StopOrdersComponent,
    PositionsComponent,
    TradesComponent,
    RepoTradesComponent,
    TradesHistoryComponent,
    PushNotificationsComponent,
    NzIconDirective,
    BlotterSettingsComponent,
    OrdersGroupModalWidgetComponent,
    AsyncPipe
  ]
})
export class BlotterWidgetComponent implements OnInit, OnDestroy {
  readonly pushNotificationsConfig = inject<PushNotificationsConfig>(PUSH_NOTIFICATIONS_CONFIG);
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly navigationStackService = inject(NavigationStackService);
  private readonly destroyRef = inject(DestroyRef);

  readonly marketTypes = MarketType;
  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  activeTabIndex$ = of(0);
  marketType$?: Observable<MarketType | undefined>;
  showBadge$!: Observable<boolean>;
  settings$!: Observable<BlotterSettings>;
  contentSize$ = new BehaviorSubject<ContentSize | null>(null);
  title$!: Observable<string>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  get isNotificationsSupported(): boolean {
    return this.pushNotificationsConfig.portfolioOrdersExecuteNotifications.isSupported
      || this.pushNotificationsConfig.priceChangeNotifications.isSupported;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createPortfolioLinkedWidgetSettingsIfMissing<BlotterSettings>(
      this.widgetInstance(),
      'BlotterSettings',
      settings => ({
        ...settings,
        showSummary: getValueOrDefault(settings.showSummary, true),
        showOrders: getValueOrDefault(settings.showOrders, true),
        showStopOrders: getValueOrDefault(settings.showStopOrders, true),
        showPositions: getValueOrDefault(settings.showPositions, true),
        showTrades: getValueOrDefault(settings.showTrades, true),
        showRepoTrades: getValueOrDefault(settings.showRepoTrades, false),
        showHistoryTrades: getValueOrDefault(settings.showHistoryTrades, true),
        showNotifications: getValueOrDefault(settings.showNotifications, true),
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
        badgeColor: getValueOrDefault(settings.badgeColor, defaultBadgeColor),
        isSoldPositionsHidden: getValueOrDefault(settings.isSoldPositionsHidden, true),
        cancelOrdersWithoutConfirmation: getValueOrDefault(settings.cancelOrdersWithoutConfirmation, false),
        showPositionActions: getValueOrDefault(settings.showPositionActions, false),
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<BlotterSettings>(this.guid);

    this.title$ = this.settings$.pipe(
      map(s => `${s.portfolio} (${s.exchange})`)
    );

    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);

    this.activeTabIndex$ = this.settings$.pipe(
      map(s => s.activeTabIndex)
    );

    this.marketType$ = this.settings$.pipe(
      map(s => getMarketTypeByPortfolio(s.portfolio)),
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
    this.widgetSettingsService.updateSettings<BlotterSettings>(this.guid, {activeTabIndex: index ?? 0});
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
