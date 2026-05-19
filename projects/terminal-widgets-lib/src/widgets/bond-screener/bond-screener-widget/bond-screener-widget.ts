import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {
  bondScreenerColumns,
  BondScreenerWidgetSettings
} from '@terminal-widgets-lib/widgets/bond-screener/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {
  NzTabComponent,
  NzTabsComponent
} from 'ng-zorro-antd/tabs';
import {BondScreener} from '@terminal-widgets-lib/widgets/bond-screener/components/bond-screener/bond-screener';
import {YieldCurveChart} from '@terminal-widgets-lib/widgets/bond-screener/components/yield-curve-chart/yield-curve-chart';
import {BondScreenerSettings} from '@terminal-widgets-lib/widgets/bond-screener/components/bond-screener-settings/bond-screener-settings';
import {BondScreenerService} from '@terminal-widgets-lib/widgets/bond-screener/services/bond-screener.service';

@Component({
  selector: 'ats-bond-screener-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    NzTabsComponent,
    NzTabComponent,
    BondScreener,
    YieldCurveChart,
    BondScreenerSettings
  ],
  templateUrl: './bond-screener-widget.html',
  styleUrl: './bond-screener-widget.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    BondScreenerService
  ]
})
export class BondScreenerWidget extends WidgetBase<BondScreenerWidgetSettings> {
  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<BondScreenerWidgetSettings>(
      this.widgetInstance(),
      'BondScreenerSettings',
      settings => ({
        ...settings,
        badgeColor: ValueHelper.getValueOrDefault(settings.badgeColor, DefaultBadge),
        bondScreenerTable: TableSettingHelper.toTableDisplaySettings(settings.bondScreenerTable, bondScreenerColumns.filter(c => c.isDefault).map(c => c.id))!,
        hideExpired: ValueHelper.getValueOrDefault(settings.hideExpired, true)
      }),
      this.widgetSettingsService
    );
  }

}
