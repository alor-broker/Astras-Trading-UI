import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { NzTabChangeEvent } from 'ng-zorro-antd/tabs';
import {
  BehaviorSubject,
  Observable,
  of,
  Subject,
  take
} from 'rxjs';
import { map } from 'rxjs/operators';
import { BlotterService } from '../../services/blotter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  allOrdersColumns,
  allPositionsColumns,
  allStopOrdersColumns,
  allTradesColumns,
  BlotterSettings
} from "../../../../shared/models/settings/blotter-settings.model";
import { MarketType } from "../../../../shared/models/portfolio-key.model";
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { defaultBadgeColor } from '../../../../shared/utils/instruments';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';

@Component({
  selector: 'ats-blotter-widget[shouldShowSettings][guid][isBlockWidget]',
  templateUrl: './blotter-widget.component.html',
  styleUrls: ['./blotter-widget.component.less'],
  providers: [
    BlotterService
  ]
})
export class BlotterWidgetComponent implements OnInit, OnDestroy {
  readonly marketTypes = MarketType;
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  isBlockWidget!: boolean;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  activeTabIndex$ = of(0);
  marketType$?: Observable<MarketType | undefined>;
  showBadge$!: Observable<boolean>;
  settings$!: Observable<BlotterSettings>;
  contentSize$ = new BehaviorSubject<ContentSize | null>(null);
  title$!: Observable<string>;

  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createPortfolioLinkedWidgetSettingsIfMissing<BlotterSettings>(
      this.guid,
      'BlotterSettings',
      settings => ({
        ...settings,
        activeTabIndex: 0,
        tradesTable: TableSettingHelper.toTableDisplaySettings(allTradesColumns.filter(c => c.isDefault).map(c => c.columnId)),
        positionsTable: TableSettingHelper.toTableDisplaySettings(allPositionsColumns.filter(c => c.isDefault).map(c => c.columnId)),
        ordersTable: TableSettingHelper.toTableDisplaySettings(allOrdersColumns.filter(c => c.isDefault).map(c => c.columnId)),
        stopOrdersTable: TableSettingHelper.toTableDisplaySettings(allStopOrdersColumns.filter(c => c.isDefault).map(c => c.columnId)),
        badgeColor: defaultBadgeColor,
        isSoldPositionsHidden: true,
        cancelOrdersWithoutConfirmation: false
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
        map(s => s.marketType)
      );
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }

  onIndexChange(event: NzTabChangeEvent) {
    this.widgetSettingsService.updateSettings(this.guid, { activeTabIndex: event.index ?? 0 });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
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
