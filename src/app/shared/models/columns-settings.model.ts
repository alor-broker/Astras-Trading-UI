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
}
