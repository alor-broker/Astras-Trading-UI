import { NzTableFilterList } from "ng-zorro-antd/table/src/table.types";

export interface ColumnsSettings {
  // Наименование свойства в объекте данных
  name: string;
  // Заоголовок столбца
  displayName: string;
  // Функция обработки данных столбца (преообразование в дату и т.п.)
  transformFn?: (data: any) => string | null;
  // Применяемые классы
  classFn?: (data: any) => string | null;
  // Ширина столбца
  width?: string;
  // Сортирующийся ли столбец
  sortFn?: (direction: string | null) => any;
  // Настройки фильтров
  filterData?: FilterData;
  // Показывать лейблы
  showBadges?: boolean
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
