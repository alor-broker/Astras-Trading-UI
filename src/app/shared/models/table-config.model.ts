import { ColumnsSettings } from './columns-settings.model';

export interface RowConfig<T> {
  rowClass?: (data: T) => string | null;
}

export interface TableConfig<T> {
  columns: ColumnsSettings[];
  rowConfig?: RowConfig<T> | null;
}
