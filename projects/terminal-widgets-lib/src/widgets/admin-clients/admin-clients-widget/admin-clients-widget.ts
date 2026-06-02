import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {
  AdminClientsTableColumns,
  AdminClientsWidgetSettings
} from '@terminal-widgets-lib/widgets/admin-clients/widgets-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {AdminClients} from '@terminal-widgets-lib/widgets/admin-clients/components/admin-clients/admin-clients';
import {AdminClientsSettings} from '@terminal-widgets-lib/widgets/admin-clients/components/admin-clients-settings/admin-clients-settings';

@Component({
  selector: 'ats-admin-clients-widget',
  imports: [
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    AdminClients,
    AdminClientsSettings
  ],
  templateUrl: './admin-clients-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminClientsWidget extends WidgetBase<AdminClientsWidgetSettings> {
  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<AdminClientsWidgetSettings>(
      this.widgetInstance(),
      'AdminClientsSettings',
      settings => ({
        ...settings,
        refreshIntervalSec: ValueHelper.getValueOrDefault(settings.refreshIntervalSec, 60),
        table: TableSettingHelper.toTableDisplaySettings(
          settings.table,
          AdminClientsTableColumns.filter(c => c.isDefault).map(c => c.id)
        )!
      }),
      this.widgetSettingsService
    );
  }
}
