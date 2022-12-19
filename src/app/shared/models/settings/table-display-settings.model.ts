export interface ColumnDisplaySettings {
  columnId: string;
  columnWidth?: number | null;
  columnOrder?: number;
}

export interface TableDisplaySettings {
  columns: ColumnDisplaySettings[];
}
