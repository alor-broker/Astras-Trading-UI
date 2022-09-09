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
  // Сортирующийся ли столбец
  isFiltering?: boolean;
  // Открыт ли фильтр
  isOpenedFilter?: boolean;
  // Выпадающий список
  isDefaultFilter?: boolean;
  // Множественный выбор
  isMultipleFilter?: boolean;
  // значения фильтров
  filters?: NzTableFilterList;
  // Показывать лейблы
  showBadges?: boolean
}
