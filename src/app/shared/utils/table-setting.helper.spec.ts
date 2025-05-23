import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { BaseColumnSettings, ColumnDisplaySettings, TableDisplaySettings } from '../models/settings/table-settings.model';
import { TableSettingHelper } from './table-setting.helper';

describe('TableSettingHelper', () => {
  describe('toTableDisplaySettings', () => {
    it('should return tableSettings if it is provided', () => {
      const settings: TableDisplaySettings = { columns: [{ columnId: 'id1', columnWidth: 100 }] };
      expect(TableSettingHelper.toTableDisplaySettings(settings, ['id2'])).toEqual(settings);
    });

    it('should convert columnIds to TableDisplaySettings if tableSettings is null', () => {
      const columnIds = ['id1', 'id2'];
      const expected: TableDisplaySettings = {
        columns: [
          { columnId: 'id1', columnWidth: null },
          { columnId: 'id2', columnWidth: null }
        ]
      };
      expect(TableSettingHelper.toTableDisplaySettings(null, columnIds)).toEqual(expected);
    });

    it('should return undefined if tableSettings is undefined and columnIds is undefined', () => {
      expect(TableSettingHelper.toTableDisplaySettings(undefined, undefined)).toBeUndefined();
    });

    it('should return undefined if tableSettings is null and columnIds is empty', () => {
      expect(TableSettingHelper.toTableDisplaySettings(null, [])).toEqual({columns: []});
    });
  });

  describe('updateColumn', () => {
    it('should update the specified column', () => {
      const target: TableDisplaySettings = {
        columns: [
          { columnId: 'id1', columnWidth: 100, columnOrder: 0 },
          { columnId: 'id2', columnWidth: 150, columnOrder: 1 }
        ]
      };
      const updates: Partial<Omit<ColumnDisplaySettings, 'id'>> = { columnWidth: 200, columnOrder: 5 };

      const expected: TableDisplaySettings = {
        columns: [
          { columnId: 'id1', columnWidth: 100, columnOrder: 0 },
          { columnId: 'id2', columnWidth: updates.columnWidth, columnOrder: updates.columnOrder }
        ]
      };
      expect(TableSettingHelper.updateColumn('id2', target, updates)).toEqual(expected);
      expect(target.columns[1].columnWidth).toBe(150);
    });

    it('should not modify target if column id is not found', () => {
      const target: TableDisplaySettings = {
        columns: [
          { columnId: 'id1', columnWidth: 100 }
        ]
      };
      const updates: Partial<Omit<ColumnDisplaySettings, 'id'>> = { columnWidth: 200 };
      expect(TableSettingHelper.updateColumn('id3', target, updates)).toEqual(target);
    });
  });

  describe('getDefaultColumnOrder', () => {
    it('should return 10000 + columnIndex', () => {
      expect(TableSettingHelper.getDefaultColumnOrder(5)).toBe(10005);
      expect(TableSettingHelper.getDefaultColumnOrder(0)).toBe(10000);
    });
  });

  describe('isTableSettingsEqual', () => {
    const settings1: TableDisplaySettings = { columns: [{ columnId: 'id1', columnWidth: 100 }] };
    const settings1Copy: TableDisplaySettings = { columns: [{ columnId: 'id1', columnWidth: 100 }] };
    const settings2: TableDisplaySettings = { columns: [{ columnId: 'id2', columnWidth: 150 }] };

    it('should return true if settings are equal', () => {
      expect(TableSettingHelper.isTableSettingsEqual(settings1, settings1Copy)).toBeTrue();
    });

    it('should return false if settings are not equal', () => {
      expect(TableSettingHelper.isTableSettingsEqual(settings1, settings2)).toBeFalse();
    });

    it('should return false if one setting is null', () => {
      expect(TableSettingHelper.isTableSettingsEqual(settings1, null)).toBeFalse();
      expect(TableSettingHelper.isTableSettingsEqual(null, settings2)).toBeFalse();
    });

    it('should return true if both settings are null', () => {
      expect(TableSettingHelper.isTableSettingsEqual(null, null)).toBeTrue();
    });
  });

  describe('changeColumnOrder', () => {
    let targetSettings: TableDisplaySettings;
    let displayColumns: BaseColumnSettings<any>[];

    beforeEach(() => {
      targetSettings = {
        columns: [
          { columnId: 'col1', columnOrder: 0, columnWidth: 100 },
          { columnId: 'col2', columnOrder: 1, columnWidth: 120 },
          { columnId: 'col3', columnOrder: 2, columnWidth: 80 },
          { columnId: 'col4', columnOrder: 3, columnWidth: 150 }
        ]
      };
      displayColumns = [
        { id: 'col1', displayName: 'Column 1', order: 0 },
        { id: 'col2', displayName: 'Column 2', order: 1 },
        { id: 'col3', displayName: 'Column 3', order: 2 },
        { id: 'col4', displayName: 'Column 4', order: 3 }
      ];
    });

    it('should correctly reorder columns when an item is moved forward', () => {
      const event = { previousIndex: 0, currentIndex: 2 } as CdkDragDrop<any>;
      const updatedSettings = TableSettingHelper.changeColumnOrder(event, targetSettings, displayColumns);

      expect(updatedSettings.columns.find(c => c.columnId === 'col2')?.columnOrder).toBe(0);
      expect(updatedSettings.columns.find(c => c.columnId === 'col3')?.columnOrder).toBe(1);
      expect(updatedSettings.columns.find(c => c.columnId === 'col1')?.columnOrder).toBe(2);
      expect(updatedSettings.columns.find(c => c.columnId === 'col4')?.columnOrder).toBe(3);
    });

    it('should correctly reorder columns when an item is moved backward', () => {
      const event = { previousIndex: 3, currentIndex: 1 } as CdkDragDrop<any>;
      const updatedSettings = TableSettingHelper.changeColumnOrder(event, targetSettings, displayColumns);

      expect(updatedSettings.columns.find(c => c.columnId === 'col1')?.columnOrder).toBe(0);
      expect(updatedSettings.columns.find(c => c.columnId === 'col4')?.columnOrder).toBe(1);
      expect(updatedSettings.columns.find(c => c.columnId === 'col2')?.columnOrder).toBe(2);
      expect(updatedSettings.columns.find(c => c.columnId === 'col3')?.columnOrder).toBe(3);
    });

    it('should not change order if previousIndex equals currentIndex', () => {
      const event = { previousIndex: 1, currentIndex: 1 } as CdkDragDrop<any>;
      const updatedSettings = TableSettingHelper.changeColumnOrder(event, targetSettings, displayColumns);

      expect(updatedSettings.columns.find(c => c.columnId === 'col1')?.columnOrder).toBe(0);
      expect(updatedSettings.columns.find(c => c.columnId === 'col2')?.columnOrder).toBe(1);
      expect(updatedSettings.columns.find(c => c.columnId === 'col3')?.columnOrder).toBe(2);
      expect(updatedSettings.columns.find(c => c.columnId === 'col4')?.columnOrder).toBe(3);
    });

    it('should handle dragging to the beginning of the list', () => {
      const event = { previousIndex: 2, currentIndex: 0 } as CdkDragDrop<any>;
      const updatedSettings = TableSettingHelper.changeColumnOrder(event, targetSettings, displayColumns);

      expect(updatedSettings.columns.find(c => c.columnId === 'col3')?.columnOrder).toBe(0);
      expect(updatedSettings.columns.find(c => c.columnId === 'col1')?.columnOrder).toBe(1);
      expect(updatedSettings.columns.find(c => c.columnId === 'col2')?.columnOrder).toBe(2);
      expect(updatedSettings.columns.find(c => c.columnId === 'col4')?.columnOrder).toBe(3);
    });

    it('should handle dragging to the end of the list', () => {
      const event = { previousIndex: 0, currentIndex: 3 } as CdkDragDrop<any>;
      const updatedSettings = TableSettingHelper.changeColumnOrder(event, targetSettings, displayColumns);

      expect(updatedSettings.columns.find(c => c.columnId === 'col2')?.columnOrder).toBe(0);
      expect(updatedSettings.columns.find(c => c.columnId === 'col3')?.columnOrder).toBe(1);
      expect(updatedSettings.columns.find(c => c.columnId === 'col4')?.columnOrder).toBe(2);
      expect(updatedSettings.columns.find(c => c.columnId === 'col1')?.columnOrder).toBe(3);
    });

    it('should preserve other column properties like width', () => {
      const event = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<any>;
      const updatedSettings = TableSettingHelper.changeColumnOrder(event, targetSettings, displayColumns);

      expect(updatedSettings.columns.find(c => c.columnId === 'col1')?.columnWidth).toBe(100);
      expect(updatedSettings.columns.find(c => c.columnId === 'col2')?.columnWidth).toBe(120);
      expect(updatedSettings.columns.find(c => c.columnId === 'col3')?.columnWidth).toBe(80);
      expect(updatedSettings.columns.find(c => c.columnId === 'col4')?.columnWidth).toBe(150);
    });
  });
});
