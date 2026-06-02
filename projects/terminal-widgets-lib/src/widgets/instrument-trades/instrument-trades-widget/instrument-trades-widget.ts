import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {
  instrumentTradesWidgetColumns,
  InstrumentTradesWidgetSettings
} from '@terminal-widgets-lib/widgets/instrument-trades/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {WidgetHeaderInstrumentSwitch} from '@terminal-widgets-lib/common/components/widget-header-instrument-switch/widget-header-instrument-switch';
import {InstrumentTrades} from '@terminal-widgets-lib/widgets/instrument-trades/components/instrument-trades/instrument-trades';
import {InstrumentTradesSettings} from '@terminal-widgets-lib/widgets/instrument-trades/components/instrument-trades-settings/instrument-trades-settings';

@Component({
  selector: 'ats-instrument-trades-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    WidgetHeaderInstrumentSwitch,
    InstrumentTrades,
    InstrumentTradesSettings
  ],
  templateUrl: './instrument-trades-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstrumentTradesWidget extends WidgetBase<InstrumentTradesWidgetSettings> {
  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createInstrumentLinkedWidgetSettingsIfMissing<InstrumentTradesWidgetSettings>(
      this.widgetInstance(),
      'AllTradesSettings',
      settings => ({
        ...settings,
        allTradesColumns: ValueHelper.getValueOrDefault(
          settings.allTradesColumns,
          instrumentTradesWidgetColumns.filter(c => c.isDefault).map(col => col.id)
        ),
        highlightRowsBySide: ValueHelper.getValueOrDefault(settings.highlightRowsBySide, false)
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }
}
