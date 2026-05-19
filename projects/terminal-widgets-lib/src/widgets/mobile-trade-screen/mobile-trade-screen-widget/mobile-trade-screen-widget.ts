import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {MobileTradeScreenWidgetSettings} from '@terminal-widgets-lib/widgets/mobile-trade-screen/widget-settings.types';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {WidgetHeaderInstrumentSwitch} from '@terminal-widgets-lib/common/components/widget-header-instrument-switch/widget-header-instrument-switch';
import {TradeScreenContent} from '@terminal-widgets-lib/widgets/mobile-trade-screen/components/trade-screen-content/trade-screen-content';

@Component({
  selector: 'ats-mobile-trade-screen-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    WidgetHeaderInstrumentSwitch,
    TradeScreenContent
  ],
  templateUrl: './mobile-trade-screen-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileTradeScreenWidget extends WidgetBase<MobileTradeScreenWidgetSettings> {
  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createInstrumentLinkedWidgetSettingsIfMissing<MobileTradeScreenWidgetSettings>(
      this.widgetInstance(),
      'TradeScreenSettings',
      settings => ({
        ...settings,
        chart: {
          ...settings.chart,
          availableTimeFrames: ValueHelper.getValueOrDefault(
            settings.chart?.availableTimeFrames,
            [
              TimeframeValue.M1,
              TimeframeValue.M15,
              TimeframeValue.H,
              TimeframeValue.Day,
              TimeframeValue.Month
            ],
          )
        },
        orderbook: {
          ...settings.orderbook,
          depth: ValueHelper.getValueOrDefault(settings.orderbook?.depth, 10)
        }
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }

}
