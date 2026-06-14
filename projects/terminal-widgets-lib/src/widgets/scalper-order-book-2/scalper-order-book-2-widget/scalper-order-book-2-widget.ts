import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {
  PanelSlots,
  PriceUnits,
  TradesClusterHighlightMode,
  VolumeHighlightMode
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {ScalperOrderBookSettings} from '@terminal-widgets-lib/widgets/scalper-order-book/components/scalper-order-book-settings/scalper-order-book-settings';
import {WidgetHeaderInstrumentSwitch} from '@terminal-widgets-lib/common/components/widget-header-instrument-switch/widget-header-instrument-switch';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {TradesClusterPanelSettingsDefaults} from '@terminal-widgets-lib/widgets/scalper-order-book/components/scalper-order-book-settings/constants/settings-defaults';
import {ScalperOrderBookConstants} from '@terminal-widgets-lib/widgets/scalper-order-book/constants/scalper-order-book.constants';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {ScalperOrderBook2WidgetSettings} from '@terminal-widgets-lib/widgets/scalper-order-book-2/widget-settings.types';
import {ScalperOrderBook2} from '@terminal-widgets-lib/widgets/scalper-order-book-2/components/scalper-order-book-2/scalper-order-book-2';

@Component({
  selector: 'ats-scalper-order-book-2-widget',
  templateUrl: './scalper-order-book-2-widget.html',
  styleUrls: ['./scalper-order-book-2-widget.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeleton,
    WidgetHeader,
    WidgetHeaderInstrumentSwitch,
    ScalperOrderBook2,
    ScalperOrderBookSettings,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ScalperOrderBook2Widget extends WidgetBase<ScalperOrderBook2WidgetSettings> {
  protected readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createInstrumentLinkedWidgetSettingsIfMissing<ScalperOrderBook2WidgetSettings>(
      this.widgetInstance(),
      'ScalperOrderBook2Settings',
      settings => ({
        ...settings,
        depth: ValueHelper.getValueOrDefault(settings.depth, 10),
        showZeroVolumeItems: ValueHelper.getValueOrDefault(settings.showZeroVolumeItems, true),
        showSpreadItems: ValueHelper.getValueOrDefault(settings.showSpreadItems, true),
        volumeHighlightMode: ValueHelper.getValueOrDefault(settings.volumeHighlightMode, VolumeHighlightMode.BiggestVolume),
        volumeHighlightFullness: ValueHelper.getValueOrDefault(settings.volumeHighlightFullness, 10000),
        volumeHighlightOptions: ValueHelper.getValueOrDefault(
          settings.volumeHighlightOptions,
          [
            {boundary: 1000, color: '#d1711b80'},
            {boundary: 5000, color: '#1e45b780'},
            {boundary: 10000, color: '#aa166480'}
          ]
        ),
        workingVolumes: ValueHelper.getValueOrDefault(settings.workingVolumes, [1, 10, 100, 1000]),
        disableHotkeys: ValueHelper.getValueOrDefault(settings.disableHotkeys, true),
        enableMouseClickSilentOrders: ValueHelper.getValueOrDefault(settings.enableMouseClickSilentOrders, false),
        enableAutoAlign: ValueHelper.getValueOrDefault(settings.enableAutoAlign, true),
        autoAlignIntervalSec: ValueHelper.getValueOrDefault(settings.autoAlignIntervalSec, 5),
        showTradesClustersPanel: ValueHelper.getValueOrDefault(settings.showTradesClustersPanel, true),
        tradesClusterPanelSettings: ValueHelper.getValueOrDefault(
          settings.tradesClusterPanelSettings,
          {
            ...TradesClusterPanelSettingsDefaults,
            highlightMode: TradesClusterHighlightMode.BuySellDominance,
            targetVolume: 10000
          }
        ),
        volumeDisplayFormat: ValueHelper.getValueOrDefault(settings.volumeDisplayFormat, NumberDisplayFormat.Default),
        showRuler: ValueHelper.getValueOrDefault(settings.showRuler, true),
        rulerSettings: ValueHelper.getValueOrDefault(
          settings.rulerSettings,
          {
            markerDisplayFormat: PriceUnits.Points
          }
        ),
        showPriceWithZeroPadding: ValueHelper.getValueOrDefault(settings.showPriceWithZeroPadding, true),
        showWorkingVolumesPanel: ValueHelper.getValueOrDefault(settings.showWorkingVolumesPanel, true),
        workingVolumesPanelSlot: ValueHelper.getValueOrDefault(settings.workingVolumesPanelSlot, PanelSlots.BottomFloatingPanel),
        showInstrumentPriceDayChange: ValueHelper.getValueOrDefault(settings.showInstrumentPriceDayChange, true),
        showShortLongIndicators: ValueHelper.getValueOrDefault(settings.showShortLongIndicators, true),
        shortLongIndicatorsUpdateIntervalSec: ValueHelper.getValueOrDefault(settings.shortLongIndicatorsUpdateIntervalSec, 60),
        showLimitOrdersVolumeIndicators: ValueHelper.getValueOrDefault(settings.showLimitOrdersVolumeIndicators, true),
        rowHeight: ValueHelper.getValueOrDefault(settings.rowHeight, 14),
        fontSize: ValueHelper.getValueOrDefault(settings.fontSize, 11),
        minorLinesStep: ValueHelper.getValueOrDefault(settings.minorLinesStep, ScalperOrderBookConstants.defaultMinorLinesStep),
        majorLinesStep: ValueHelper.getValueOrDefault(settings.majorLinesStep, ScalperOrderBookConstants.defaultMajorLinesStep),
        showTradesPanel: ValueHelper.getValueOrDefault(settings.showTradesPanel, true),
        tradesPanelSettings: {
          minTradeVolumeFilter: ValueHelper.getValueOrDefault(settings.tradesPanelSettings?.minTradeVolumeFilter ?? null, 0),
          hideFilteredTrades: ValueHelper.getValueOrDefault(settings.tradesPanelSettings?.hideFilteredTrades ?? null, false),
          tradesAggregationPeriodMs: ValueHelper.getValueOrDefault(settings.tradesPanelSettings?.tradesAggregationPeriodMs ?? null, 0),
          showOwnTrades: ValueHelper.getValueOrDefault(settings.tradesPanelSettings?.showOwnTrades ?? null, true),
        }
      }),
      this.dashboardContextService,
      this.widgetSettingsService,
    );
  }
}
