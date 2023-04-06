import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { BaseColumnSettings, TableDisplaySettings } from '../../../shared/models/settings/table-settings.model';
import { TableSettingHelper } from '../../../shared/utils/table-setting.helper';

export class BlotterTablesHelper {
  static changeColumnOrder(
    event: CdkDragDrop<any>,
    targetSettings: TableDisplaySettings,
    displayColumns: BaseColumnSettings<any>[]): TableDisplaySettings {
    let updatedSettings = targetSettings;

    const currentColumn = displayColumns[event.previousIndex];
    displayColumns.splice(event.previousIndex, 1);
    displayColumns.splice(event.currentIndex, 0, currentColumn);
    displayColumns.forEach((column, index) => {
      const columnSettings = targetSettings.columns.find(c => c.id === column.id)!;

      updatedSettings = TableSettingHelper.updateColumn(
        columnSettings.id,
        updatedSettings,
        {
          columnOrder: index
        }
      );
    });

    return updatedSettings;
  }
}
