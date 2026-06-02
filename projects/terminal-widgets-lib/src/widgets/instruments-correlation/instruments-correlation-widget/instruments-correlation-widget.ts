import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {InstrumentsCorrelationService} from '@terminal-widgets-lib/widgets/instruments-correlation/services/instruments-correlation.service';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {InstrumentsCorrelationWidgetSettings} from '@terminal-widgets-lib/widgets/instruments-correlation/widget-settings.types';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {CorrelationChart} from '@terminal-widgets-lib/widgets/instruments-correlation/components/correlation-chart/correlation-chart';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';

@Component({
  selector: 'ats-instruments-correlation-widget',
  imports: [
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    CorrelationChart
  ],
  templateUrl: './instruments-correlation-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    InstrumentsCorrelationService
  ]
})
export class InstrumentsCorrelationWidget extends WidgetBase<InstrumentsCorrelationWidgetSettings> {
  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<InstrumentsCorrelationWidgetSettings>(
      this.widgetInstance(),
      'InstrumentsCorrelationSettings',
      settings => ({
        ...settings,
      }),
      this.widgetSettingsService
    );
  }
}
