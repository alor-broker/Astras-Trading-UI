import { NzTableFilterList, NzTableSortFn, NzTableSortOrder } from "ng-zorro-antd/table";
import { NzOptionComponent } from "ng-zorro-antd/select";

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
  sourceField?: string;
  transformFn?: (data: any) => string | null;
  classFn?: (data: T) => string | null;
  width?: number | null;
  filterData?: FilterData;
  showBadges?: boolean;
  sortOrder?: NzTableSortOrder | null;
  sortFn?: NzTableSortFn<T> | null;
  sortChangeFn?: (direction: string | null) => any;
  tooltip?: string;
  minWidth?: number | null;
  order?: number | null;
  leftFixed?: boolean;
  isResizable?: boolean;
}

export interface FilterData {
  // Наименование фильтра
  filterName: string;
  // Открыт ли фильтр
  isOpenedFilter?: boolean;
  filterType: FilterType;
  filters?: NzTableFilterList;
  intervalStartName?: string;
  intervalEndName?: string;
  inputFieldType?: InputFieldType;
  multipleAutocompleteSelectedOptionLabelKey?: keyof NzOptionComponent;
}

export enum FilterType {
  Default = 'default',
  DefaultMultiple = 'defaultMultiple',
  Interval = 'interval',
  Search = 'search',
  MultipleAutocomplete = 'multipleAutocomplete'
}

export enum InputFieldType {
  String = 'string',
  Number = 'number'
}

export interface DefaultTableFilters {
  [filterName: string]: string | string[] | number | boolean | null | undefined;
}
