import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {MarketTrendsWidgetSettings} from '@terminal-widgets-lib/widgets/market-trends/widget-settings.types';
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {
  ExtendedFilter,
  MarketSector
} from '@terminal-widgets-lib/widgets/market-trends/types/market-trends.types';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {take} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {MarketTrends} from '@terminal-widgets-lib/widgets/market-trends/components/market-trends/market-trends';
import {MarketTrendsSettingsComponent} from '@terminal-widgets-lib/widgets/market-trends/components/market-trends-settings/market-trends-settings';

@Component({
  selector: 'ats-market-trends-desktop-widget',
  imports: [
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    MarketTrends,
    MarketTrendsSettingsComponent
  ],
  templateUrl: './market-trends-desktop-widget.html',
  styleUrl: './market-trends-desktop-widget.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketTrendsDesktopWidget extends WidgetBase<MarketTrendsWidgetSettings> {
  private readonly actionsContext = inject(ACTIONS_CONTEXT);

  selectInstrument(instrumentKey: InstrumentKey): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext.selectInstrument(instrumentKey, s.badgeColor ?? DefaultBadge);
    });
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<MarketTrendsWidgetSettings>(
      this.widgetInstance(),
      'MarketTrendsSettings',
      settings => ({
        ...settings,
        badgeColor: ValueHelper.getValueOrDefault(settings.badgeColor, DefaultBadge),
        displaySectors: ValueHelper.getValueOrDefault(
          settings.displaySectors,
          settings.availableSectors ?? Object.values(MarketSector)
        ),
        extendedFilter: ValueHelper.getValueOrDefault(
          settings.extendedFilter,
          settings.availableExtendedFilters ?? Object.values(ExtendedFilter)
        ),
        itemsCount: ValueHelper.getValueOrDefault(settings.itemsCount, 20)
      }),
      this.widgetSettingsService
    );
  }
}
