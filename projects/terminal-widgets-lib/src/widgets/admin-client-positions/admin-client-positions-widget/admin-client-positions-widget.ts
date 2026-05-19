import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {
  AdminClientPositionsTableColumns,
  AdminClientPositionsWidgetSettings
} from '@terminal-widgets-lib/widgets/admin-client-positions/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {AdminClientPositionsComponent} from '@terminal-widgets-lib/widgets/admin-client-positions/components/admin-client-positions/admin-client-positions';
import {AdminClientPositionsSettings} from '@terminal-widgets-lib/widgets/admin-client-positions/components/admin-client-positions-settings/admin-client-positions-settings';

@Component({
  selector: 'ats-admin-client-positions-widget',
  imports: [
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    AdminClientPositionsComponent,
    AdminClientPositionsSettings
  ],
  templateUrl: './admin-client-positions-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminClientPositionsWidget extends WidgetBase<AdminClientPositionsWidgetSettings> {
  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<AdminClientPositionsWidgetSettings>(
      this.widgetInstance(),
      'AdminClientPositionsSettings',
      settings => ({
        ...settings,
        refreshIntervalSec: ValueHelper.getValueOrDefault(settings.refreshIntervalSec, 60),
        table: TableSettingHelper.toTableDisplaySettings(
          settings.table,
          AdminClientPositionsTableColumns.filter(c => c.isDefault).map(c => c.id)
        )!
      }),
      this.widgetSettingsService
    );
  }
}
