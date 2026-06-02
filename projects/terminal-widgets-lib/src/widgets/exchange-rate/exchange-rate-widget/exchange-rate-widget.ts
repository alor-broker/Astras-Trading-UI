import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {ExchangeRateWidgetSettings} from '@terminal-widgets-lib/widgets/exchange-rate/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {ExchangeRate} from '@terminal-widgets-lib/widgets/exchange-rate/components/exchange-rate/exchange-rate';

@Component({
  selector: 'ats-exchange-rate-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    ExchangeRate
  ],
  templateUrl: './exchange-rate-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExchangeRateWidget extends WidgetBase<ExchangeRateWidgetSettings> {
  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<ExchangeRateWidgetSettings>(
      this.widgetInstance(),
      'ExchangeRateSettings',
      settings => ({
        ...settings,
        badgeColor: ValueHelper.getValueOrDefault(settings.badgeColor, DefaultBadge),
      }),
      this.widgetSettingsService
    );
  }
}
