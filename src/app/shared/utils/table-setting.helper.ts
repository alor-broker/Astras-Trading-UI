import {
  ColumnDisplaySettings,
  TableDisplaySettings
} from '../models/settings/table-display-settings.model';

export class TableSettingHelper {
  /**
   * Converts old table settings to new format
   * @param columnIds old format settings
   * @returns new table settings format
   */
  static toTableDisplaySettings(columnIds?: string[]): TableDisplaySettings | undefined {
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
   * @param columnId target column id
   * @param target target table settings
   * @param updates column parameters to modify
   */
  static updateColumn(
    columnId: string,
    target: TableDisplaySettings,
    updates: Partial<Omit<ColumnDisplaySettings, 'columnId'>>): TableDisplaySettings {
    const targetColumnIndex = target.columns.findIndex(x => x.columnId === columnId);

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
}
