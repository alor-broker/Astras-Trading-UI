import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { BaseColumnId, TableDisplaySettings } from "../../../shared/models/settings/table-settings.model";

export interface BondScreenerSettings extends WidgetSettings {
  bondScreenerTable: TableDisplaySettings;
  notShowExpired: boolean;
}

export const bondScreenerColumns: BaseColumnId[] = [
  { id: 'tradingStatusInfo', displayName: "Статус", isDefault: false },
  { id: 'symbol', displayName: "Тикер", isDefault: true },
  { id: 'shortName', displayName: "Назв.", isDefault: true },
  { id: 'exchange', displayName: "Биржа", isDefault: false },
  { id: 'maturityDate', displayName: "Дата погашения", isDefault: true },
  { id: 'placementEndDate', displayName: "Дата окончания размещения", isDefault: true },
  { id: 'currentYield', displayName: "Доходность, %", isDefault: true },
  { id: 'emissionValue', displayName: "Заявл. объём выпуска", isDefault: true },
  { id: 'couponType', displayName: "Тип купона", isDefault: true },
  { id: 'couponRate', displayName: "Ставка купона", isDefault: true },
  { id: 'cancellation', displayName: "Дата окончания", isDefault: false },
  { id: 'priceMultiplier', displayName: "Множитель цены", isDefault: false },
  { id: 'board', displayName: "Режим торогов", isDefault: false },
  { id: 'guaranteed', displayName: "Гарантия", isDefault: false },
  { id: 'hasOffer', displayName: "Доср. выкуп/погашение", isDefault: false },
  { id: 'lotSize', displayName: "Размер лота", isDefault: false },
  { id: 'minStep', displayName: "Шаг цены", isDefault: false },
  { id: 'priceMax', displayName: "Макс. цена", isDefault: false },
  { id: 'priceMin', displayName: "Мин. цена", isDefault: false },
  { id: 'priceStep', displayName: "Стоимость шага цены", isDefault: false },
];
