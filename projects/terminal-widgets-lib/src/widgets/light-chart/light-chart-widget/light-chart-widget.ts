import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {
  LightChartWidgetSettings,
  TimeFrameDisplayMode
} from '@terminal-widgets-lib/widgets/light-chart/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {
  LightChartComponent,
  LightChartDisplaySettings
} from '@terminal-widgets-lib/widgets/light-chart/components/light-chart/light-chart';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {Observable} from 'rxjs';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {map} from 'rxjs/operators';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {WidgetHeaderInstrumentSwitch} from '@terminal-widgets-lib/common/components/widget-header-instrument-switch/widget-header-instrument-switch';
import {LightChartSettingsComponent} from '@terminal-widgets-lib/widgets/light-chart/components/light-chart-settings/light-chart-settings';
import {LightChartDatafeedFactoryService} from '@terminal-widgets-lib/widgets/light-chart/services/light-chart-datafeed-factory.service';

@Component({
  selector: 'ats-light-chart-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    WidgetHeaderInstrumentSwitch,
    LightChartComponent,
    LightChartSettingsComponent
  ],
  templateUrl: './light-chart-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    LightChartDatafeedFactoryService
  ]
})
export class LightChartWidget extends WidgetBase<LightChartWidgetSettings> {
  protected chartSettings$!: Observable<LightChartDisplaySettings>;

  protected readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  override ngOnInit() {
    super.ngOnInit();


    this.chartSettings$ = this.settings$.pipe(
      map(s => {
        return {
          targetInstrument: {
            symbol: s.symbol,
            exchange: s.exchange,
            instrumentGroup: s.instrumentGroup
          },
          chart: {
            availableTimeFrames: s.availableTimeFrames,
            timeFrameDisplayMode: s.timeFrameDisplayMode,
          }
        } satisfies LightChartDisplaySettings;
      })
    );
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createInstrumentLinkedWidgetSettingsIfMissing<LightChartWidgetSettings>(
      this.widgetInstance(),
      'LightChartSettings',
      settings => ({
        ...settings,
        timeFrame: ValueHelper.getValueOrDefault(settings.timeFrame, TimeframeValue.Day),
        timeFrameDisplayMode: ValueHelper.getValueOrDefault(settings.timeFrameDisplayMode, TimeFrameDisplayMode.Buttons),
        availableTimeFrames: [TimeframeValue.M1, TimeframeValue.M15, TimeframeValue.H, TimeframeValue.Day],
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }

  protected updateSelectedTimeFrame(timeFrame: TimeframeValue): void {
    this.widgetSettingsService.updateSettings<LightChartWidgetSettings>(
      this.guid,
      {
        timeFrame
      }
    );
  }
}
