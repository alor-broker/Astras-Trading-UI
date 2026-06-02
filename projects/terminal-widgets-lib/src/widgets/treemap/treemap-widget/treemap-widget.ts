import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '../../../common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '../../../common/components/widget-header/widget-header';
import {Treemap} from '../components/treemap/treemap';
import {TreemapSettings} from '../components/treemap-settings/treemap-settings';
import {TreemapWidgetSettings} from '../widget-settings.types';
import {TreemapService} from '@terminal-widgets-lib/widgets/treemap/services/treemap.service';

@Component({
  selector: 'ats-treemap-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    Treemap,
    TreemapSettings,
  ],
  templateUrl: './treemap-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TreemapService
  ]
})
export class TreemapWidget extends WidgetBase<TreemapWidgetSettings> {
  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<TreemapWidgetSettings>(
      this.widgetInstance(),
      'TreemapSettings',
      settings => ({
        ...settings,
        badgeColor: ValueHelper.getValueOrDefault(settings.badgeColor, DefaultBadge),
        refreshIntervalSec: ValueHelper.getValueOrDefault(settings.refreshIntervalSec, 60)
      }),
      this.widgetSettingsService
    );
  }
}
