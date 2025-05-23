import {
  Component, Inject,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { NzTabChangeEvent } from 'ng-zorro-antd/tabs';
import {
    BehaviorSubject,
    Observable,
    of,
    shareReplay,
    take
} from 'rxjs';
import { map } from 'rxjs/operators';
import { BlotterService } from '../../services/blotter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { MarketType } from "../../../../shared/models/portfolio-key.model";
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { defaultBadgeColor } from '../../../../shared/utils/instruments';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
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
import { getValueOrDefault } from "../../../../shared/utils/object-helper";
import {
  PUSH_NOTIFICATIONS_CONFIG,
  PushNotificationsConfig
} from "../../../push-notifications/services/push-notifications-config";

@Component({
    selector: 'ats-blotter-widget',
    templateUrl: './blotter-widget.component.html',
    styleUrls: ['./blotter-widget.component.less'],
    providers: [
        BlotterService
    ],
    standalone: false
})
export class BlotterWidgetComponent implements OnInit, OnDestroy {
  readonly marketTypes = MarketType;
  shouldShowSettings = false;

  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  activeTabIndex$ = of(0);
  marketType$?: Observable<MarketType | undefined>;
  showBadge$!: Observable<boolean>;
  settings$!: Observable<BlotterSettings>;
  contentSize$ = new BehaviorSubject<ContentSize | null>(null);
  title$!: Observable<string>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    @Inject(PUSH_NOTIFICATIONS_CONFIG)
    readonly pushNotificationsConfig: PushNotificationsConfig
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  get isNotificationsSupported(): boolean {
    return this.pushNotificationsConfig.portfolioOrdersExecuteNotifications.isSupported
      || this.pushNotificationsConfig.priceChangeNotifications.isSupported;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createPortfolioLinkedWidgetSettingsIfMissing<BlotterSettings>(
      this.widgetInstance,
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
        ) ,
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
      map(s => s.activeTabIndex),
      take(1)
    );

    this.marketType$ = this.settings$.pipe(
      map(s => getMarketTypeByPortfolio(s.portfolio)),
      shareReplay(1)
    );
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  onIndexChange(event: NzTabChangeEvent): void {
    this.widgetSettingsService.updateSettings(this.widgetInstance.instance.guid, { activeTabIndex: event.index ?? 0 });
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
