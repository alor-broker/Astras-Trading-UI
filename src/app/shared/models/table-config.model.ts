import { BaseColumnSettings } from "./settings/table-settings.model";

export interface RowConfig<T> {
  rowClass?: (data: T) => string | null;
}

export interface TableConfig<T> {
  columns: BaseColumnSettings<T>[];
  rowConfig?: RowConfig<T> | null;
}
