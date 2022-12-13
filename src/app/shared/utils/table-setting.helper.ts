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

  /**
   * Generates default column order
   * @param columnIndex column index in columns array
   * @param target target table settings
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
  static isTableSettingsEqual(settings1?: TableDisplaySettings | null, settings2?: TableDisplaySettings | null) {
    return JSON.stringify(settings1) === JSON.stringify(settings2);
  }
}
