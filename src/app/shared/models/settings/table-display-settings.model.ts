export interface ColumnDisplaySettings {
  columnId: string;
  columnWidth?: number | null;
}

export interface TableDisplaySettings {
  columns: ColumnDisplaySettings[];
}
