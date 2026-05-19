import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {
  watchlistColumns,
  WatchlistsWidgetSettings
} from '@terminal-widgets-lib/widgets/watchlists/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {WatchlistSettings} from '@terminal-widgets-lib/widgets/watchlists/components/watchlist-settings/watchlist-settings';
import {WatchlistView} from '@terminal-widgets-lib/widgets/watchlists/components/watchlist-view/watchlist-view';

@Component({
  selector: 'ats-watchlists-widget',
  imports: [
    WidgetSkeleton,
    TranslocoDirective,
    AsyncPipe,
    WidgetHeader,
    WatchlistSettings,
    WatchlistView
  ],
  templateUrl: './watchlists-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistsWidget extends WidgetBase<WatchlistsWidgetSettings> {
  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<WatchlistsWidgetSettings>(
      this.widgetInstance(),
      'InstrumentSelectSettings',
      settings => ({
        ...settings,
        instrumentColumns: ValueHelper.getValueOrDefault(settings.instrumentColumns, watchlistColumns.filter(c => c.isDefault).map(c => c.id)),
        badgeColor: DefaultBadge,
        showFavorites: ValueHelper.getValueOrDefault(settings.showFavorites, true)
      }),
      this.widgetSettingsService
    );
  }

}
