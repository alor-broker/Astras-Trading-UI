import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { NzTabChangeEvent } from 'ng-zorro-antd/tabs';
import {
  BehaviorSubject,
  Observable,
  of,
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
  BlotterSettings
} from '../../models/blotter-settings.model';
import {getMarketTypeByPortfolio} from "../../../../shared/utils/portfolios";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";

@Component({
  selector: 'ats-blotter-widget',
  templateUrl: './blotter-widget.component.html',
  styleUrls: ['./blotter-widget.component.less'],
  providers: [
    BlotterService
  ]
})
export class BlotterWidgetComponent implements OnInit, OnDestroy {
  readonly marketTypes = MarketType;
  shouldShowSettings: boolean = false;

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
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createPortfolioLinkedWidgetSettingsIfMissing<BlotterSettings>(
      this.widgetInstance,
      'BlotterSettings',
      settings => ({
        ...settings,
        tradesTable: getValueOrDefault(
          settings.tradesTable,
          TableSettingHelper.toTableDisplaySettings(allTradesColumns.filter(c => c.isDefault).map(c => c.id))
        ),
        positionsTable: getValueOrDefault(
          settings.positionsTable,
          TableSettingHelper.toTableDisplaySettings(allPositionsColumns.filter(c => c.isDefault).map(c => c.id))
        ),
        ordersTable: getValueOrDefault(
          settings.ordersTable,
          TableSettingHelper.toTableDisplaySettings(allOrdersColumns.filter(c => c.isDefault).map(c => c.id))
        ),
        stopOrdersTable: getValueOrDefault(
          settings.stopOrdersTable,
          TableSettingHelper.toTableDisplaySettings(allStopOrdersColumns.filter(c => c.isDefault).map(c => c.id))
        ) ,
        notificationsTable: getValueOrDefault(
          settings.notificationsTable,
          TableSettingHelper.toTableDisplaySettings(allNotificationsColumns.filter(c => c.isDefault).map(c => c.id))
        ),
        repoTradesTable: getValueOrDefault(
          settings.repoTradesTable,
          TableSettingHelper.toTableDisplaySettings(allRepoTradesColumns.filter(c => c.isDefault).map(c => c.id))
        ),
        badgeColor: getValueOrDefault(settings.badgeColor, defaultBadgeColor),
        isSoldPositionsHidden: getValueOrDefault(settings.isSoldPositionsHidden, true),
        cancelOrdersWithoutConfirmation: getValueOrDefault(settings.cancelOrdersWithoutConfirmation, false)
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

    this.marketType$ = this.settings$
      .pipe(
        map(s => getMarketTypeByPortfolio(s.portfolio))
      );
  }

  onSettingsChange() {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  onIndexChange(event: NzTabChangeEvent) {
    this.widgetSettingsService.updateSettings(this.widgetInstance.instance.guid, { activeTabIndex: event.index ?? 0 });
  }

  ngOnDestroy() {
    this.contentSize$.complete();
  }

  containerSizeChanged(entries: ResizeObserverEntry[]) {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }
}
