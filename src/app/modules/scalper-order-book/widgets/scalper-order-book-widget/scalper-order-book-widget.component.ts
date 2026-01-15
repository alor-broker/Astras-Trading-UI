import { Component, OnInit, input, inject } from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import { Observable } from 'rxjs';
import {
  PanelSlots,
  PriceUnits,
  ScalperOrderBookWidgetSettings,
  TradesClusterHighlightMode,
  VolumeHighlightMode
} from '../../models/scalper-order-book-settings.model';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";
import { ScalperOrderBookConstants } from "../../constants/scalper-order-book.constants";
import { TradesClusterPanelSettingsDefaults } from "../../components/scalper-order-book-settings/constants/settings-defaults";
import { TranslocoDirective } from '@jsverse/transloco';
import { WidgetSkeletonComponent } from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import { WidgetHeaderComponent } from '../../../../shared/components/widget-header/widget-header.component';
import { WidgetHeaderInstrumentSwitchComponent } from '../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component';
import { ScalperOrderBookComponent } from '../../components/scalper-order-book/scalper-order-book.component';
import { ScalperOrderBookSettingsComponent } from '../../components/scalper-order-book-settings/scalper-order-book-settings.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'ats-scalper-order-book-widget',
    templateUrl: './scalper-order-book-widget.component.html',
    styleUrls: ['./scalper-order-book-widget.component.less'],
    imports: [
      TranslocoDirective,
      WidgetSkeletonComponent,
      WidgetHeaderComponent,
      WidgetHeaderInstrumentSwitchComponent,
      ScalperOrderBookComponent,
      ScalperOrderBookSettingsComponent,
      AsyncPipe
    ]
})
export class ScalperOrderBookWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  shouldShowSettings = false;

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  readonly isActive = input(false);

  settings$!: Observable<ScalperOrderBookWidgetSettings>;
  showBadge$!: Observable<boolean>;

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  onSettingsChange(): void {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<ScalperOrderBookWidgetSettings>(
      this.widgetInstance(),
      'ScalperOrderBookSettings',
      settings => ({
        ...settings,
        depth: getValueOrDefault(settings.depth, 10),
        showZeroVolumeItems: getValueOrDefault(settings.showZeroVolumeItems, true),
        showSpreadItems: getValueOrDefault(settings.showSpreadItems, true),
        volumeHighlightMode: getValueOrDefault(settings.volumeHighlightMode, VolumeHighlightMode.BiggestVolume),
        volumeHighlightFullness: getValueOrDefault(settings.volumeHighlightFullness, 10000),
        volumeHighlightOptions: getValueOrDefault(
          settings.volumeHighlightOptions,
          [
            { boundary: 1000, color: '#d1711b80' },
            { boundary: 5000, color: '#1e45b780' },
            { boundary: 10000, color: '#aa166480' }
          ]
          ),
        workingVolumes: getValueOrDefault(settings.workingVolumes, [1, 10, 100, 1000]),
        disableHotkeys: getValueOrDefault(settings.disableHotkeys, true),
        enableMouseClickSilentOrders: getValueOrDefault(settings.enableMouseClickSilentOrders, false),
        enableAutoAlign: getValueOrDefault(settings.enableAutoAlign, true),
        autoAlignIntervalSec: getValueOrDefault(settings.autoAlignIntervalSec, 5),
        showTradesClustersPanel: getValueOrDefault(settings.showTradesClustersPanel, true),
        tradesClusterPanelSettings: getValueOrDefault(
          settings.tradesClusterPanelSettings,
          {
            ...TradesClusterPanelSettingsDefaults,
            highlightMode: TradesClusterHighlightMode.BuySellDominance,
            targetVolume:10000
          }
        ),
        volumeDisplayFormat: getValueOrDefault(settings.volumeDisplayFormat, NumberDisplayFormat.Default),
        showRuler: getValueOrDefault(settings.showRuler, true),
        rulerSettings: getValueOrDefault(
          settings.rulerSettings,
          {
            markerDisplayFormat: PriceUnits.Points
          }
        ),
        showPriceWithZeroPadding: getValueOrDefault(settings.showPriceWithZeroPadding, true),
        showWorkingVolumesPanel: getValueOrDefault(settings.showInstrumentPriceDayChange, true),
        workingVolumesPanelSlot: getValueOrDefault(settings.workingVolumesPanelSlot, PanelSlots.BottomFloatingPanel),
        showInstrumentPriceDayChange: getValueOrDefault(settings.showInstrumentPriceDayChange, true),
        showShortLongIndicators: getValueOrDefault(settings.showShortLongIndicators, true),
        shortLongIndicatorsUpdateIntervalSec: getValueOrDefault(settings.shortLongIndicatorsUpdateIntervalSec, 60),
        showLimitOrdersVolumeIndicators: getValueOrDefault(settings.showLimitOrdersVolumeIndicators, true),
        rowHeight: getValueOrDefault(settings.rowHeight, 14),
        fontSize: getValueOrDefault(settings.fontSize, 11),
        minorLinesStep: getValueOrDefault(settings.minorLinesStep, ScalperOrderBookConstants.defaultMinorLinesStep),
        majorLinesStep: getValueOrDefault(settings.majorLinesStep, ScalperOrderBookConstants.defaultMajorLinesStep),
        showTradesPanel: getValueOrDefault(settings.showTradesPanel, true),
        tradesPanelSettings: {
          minTradeVolumeFilter: getValueOrDefault(settings.tradesPanelSettings?.minTradeVolumeFilter ?? null, 0),
          hideFilteredTrades: getValueOrDefault(settings.tradesPanelSettings?.hideFilteredTrades ?? null, false),
          tradesAggregationPeriodMs: getValueOrDefault(settings.tradesPanelSettings?.tradesAggregationPeriodMs ?? null, 0),
          showOwnTrades: getValueOrDefault(settings.tradesPanelSettings?.showOwnTrades ?? null, true),
        }
      }),
      this.dashboardContextService,
      this.widgetSettingsService,
    );

    this.settings$ = this.widgetSettingsService.getSettings<ScalperOrderBookWidgetSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
