import {
  BaseColumnSettings,
  ColumnDisplaySettings,
  TableDisplaySettings
} from '../models/settings/table-settings.model';
import { CdkDragDrop } from "@angular/cdk/drag-drop";

export class TableSettingHelper {
  /**
   * Converts old table settings to new format
   * @param tableSettings new table settings if exists
   * @param columnIds old format settings
   * @returns new table settings format
   */
  static toTableDisplaySettings(tableSettings?: TableDisplaySettings | null, columnIds?: string[]): TableDisplaySettings | undefined {
    if (tableSettings != null) {
      return tableSettings;
    }

    if (!columnIds) {
      return undefined;
    }

    return {
      columns: columnIds.map(x => ({
        columnId: x,
        columnWidth: null
      }))
    };
  }

  /**
   * Updates column settings
   * @param id target column id
   * @param target target table settings
   * @param updates column parameters to modify
   */
  static updateColumn(
    id: string,
    target: TableDisplaySettings,
    updates: Partial<Omit<ColumnDisplaySettings, 'id'>>): TableDisplaySettings {
    const targetColumnIndex = target.columns.findIndex(x => x.columnId === id);

    if (targetColumnIndex < 0) {
      return target;
    }

    const updated = {
      ...target,
      columns: [...target.columns]
    };

    updated.columns[targetColumnIndex] = {
      ...target.columns[targetColumnIndex],
      ...updates
    };

    return updated;
  }

  /**
   * Generates default column order
   * @param columnIndex column index in columns array
   * @returns default column order
   */
  static getDefaultColumnOrder(columnIndex: number): number {
    // we just have to be sure that the default order will be at the end of the list.
    return 10000 + columnIndex;
  }

  /**
   * Checks if table display settings are equal
   * @param settings1 first settings
   * @param settings2 second settings
   * @returns true is equal, false if not
   */
  static isTableSettingsEqual(settings1?: TableDisplaySettings | null, settings2?: TableDisplaySettings | null): boolean {
    return JSON.stringify(settings1) === JSON.stringify(settings2);
  }

  /**
   * Change table columns order
   * @param event drag-n-drop event
   * @param targetSettings table settings
   * @param displayColumns displayed columns list
   * @returns updated settings with new columns order
   */
  static changeColumnOrder(
    event: CdkDragDrop<any>,
    targetSettings: TableDisplaySettings,
    displayColumns: BaseColumnSettings<any>[]): TableDisplaySettings {
    let updatedSettings = targetSettings;

    const currentColumn = displayColumns[event.previousIndex];
    displayColumns.splice(event.previousIndex, 1);
    displayColumns.splice(event.currentIndex, 0, currentColumn);
    displayColumns.forEach((column, index) => {
      const columnSettings = targetSettings.columns.find(c => c.columnId === column.id)!;

      updatedSettings = TableSettingHelper.updateColumn(
        columnSettings.columnId,
        updatedSettings,
        {
          columnOrder: index
        }
      );
    });

    return updatedSettings;
  }
}
