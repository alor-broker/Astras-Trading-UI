import { NzTableFilterList, NzTableSortFn, NzTableSortOrder } from "ng-zorro-antd/table";

export interface BaseColumnId {
  id: string;
  displayName: string;
  isDefault: boolean;
}

export interface ColumnDisplaySettings {
  columnId: string;
  columnWidth?: number | null;
  columnOrder?: number;
}

export interface TableDisplaySettings {
  columns: ColumnDisplaySettings[];
}

export interface BaseColumnSettings<T> extends Omit<BaseColumnId, 'isDefault'> {
  transformFn?: (data: any) => string | null;
  classFn?: (data: T) => string | null;
  width?: number | null;
  filterData?: FilterData;
  showBadges?: boolean
  sortOrder?: NzTableSortOrder | null;
  sortFn?: NzTableSortFn<T> | null;
  sortChangeFn?: (direction: string | null) => any;
  tooltip?: string;
  minWidth?: number | null;
  order?: number | null;
}

export interface FilterData {
  // Наименование фильтра
  filterName: string;
  // Открыт ли фильтр
  isOpenedFilter?: boolean;
  // Выпадающий список
  isDefaultFilter?: boolean;
  // Множественный выбор
  isMultipleFilter?: boolean;
  // значения фильтров
  filters?: NzTableFilterList;
  isInterval?: boolean;
  intervalStartName?: string;
  intervalEndName?: string;
}
