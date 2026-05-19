import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {ArbitrageSpreadService} from '@terminal-widgets-lib/widgets/arbitrage-spread/services/arbitrage-spread.service';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {ArbitrageSpreadWidgetSettings} from '@terminal-widgets-lib/widgets/arbitrage-spread/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {AsyncPipe} from '@angular/common';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {ArbitrageSpreadTable} from '@terminal-widgets-lib/widgets/arbitrage-spread/components/arbitrage-spread-table/arbitrage-spread-table';
import {ArbitrageSpreadManageDialog} from '@terminal-widgets-lib/widgets/arbitrage-spread/components/arbitrage-spread-manage-dialog/arbitrage-spread-manage-dialog';

@Component({
  selector: 'ats-arbitrage-spread-widget',
  imports: [
    TranslocoDirective,
    WidgetSkeleton,
    AsyncPipe,
    WidgetHeader,
    ArbitrageSpreadTable,
    ArbitrageSpreadManageDialog
  ],
  templateUrl: './arbitrage-spread-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ArbitrageSpreadService
  ]
})
export class ArbitrageSpreadWidget extends WidgetBase<ArbitrageSpreadWidgetSettings> {
  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<ArbitrageSpreadWidgetSettings>(
      this.widgetInstance(),
      'ArbitrationExtensionSettings',
      settings => ({
        ...settings,
      }),
      this.widgetSettingsService
    );
  }

}
