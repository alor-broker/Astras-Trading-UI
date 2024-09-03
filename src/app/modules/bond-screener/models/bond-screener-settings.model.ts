import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { BaseColumnId, TableDisplaySettings } from "../../../shared/models/settings/table-settings.model";

export interface BondScreenerSettings extends WidgetSettings {
  bondScreenerTable: TableDisplaySettings;
  hideExpired: boolean;
}

export const bondScreenerColumns: BaseColumnId[] = [
  { id: 'tradingStatusInfo', displayName: "Статус", isDefault: false },
  { id: 'symbol', displayName: "Тикер", isDefault: true },
  { id: 'shortName', displayName: "Назв.", isDefault: true },
  { id: 'exchange', displayName: "Биржа", isDefault: false },
  { id: 'complexProductCategory', displayName: "Категория для торговли", isDefault: false },
  { id: 'maturityDate', displayName: "Дата погашения", isDefault: true },
  { id: 'placementEndDate', displayName: "Дата окончания размещения", isDefault: true },
  { id: 'currentYield', displayName: "Доходность, %", isDefault: true },
  { id: 'issueValue', displayName: "Номинал", isDefault: false },
  { id: 'faceValue', displayName: "Ост. номинал", isDefault: false },
  { id: 'currentFaceValue', displayName: "Заявл. объём выпуска", isDefault: true },
  { id: 'couponType', displayName: "Тип купона", isDefault: true },
  { id: 'couponRate', displayName: "Ставка купона", isDefault: true },
  { id: 'couponAccruedInterest', displayName: "НКД", isDefault: false },
  { id: 'couponDate', displayName: "Дата выплаты ближ. купона", isDefault: false },
  { id: 'couponIntervalInDays', displayName: "Период купона, д.", isDefault: false },
  { id: 'couponAmount', displayName: "Размер купона", isDefault: false },
  { id: 'offerDate', displayName: "Дата ближайшей оферты", isDefault: false },
  { id: 'cancellation', displayName: "Дата окончания", isDefault: false },
  { id: 'priceMultiplier', displayName: "Множитель цены", isDefault: false },
  { id: 'board', displayName: "Режим торгов", isDefault: false },
  { id: 'guaranteed', displayName: "Гарантия", isDefault: false },
  { id: 'hasOffer', displayName: "Есть оферта", isDefault: false },
  { id: 'hasAmortization', displayName: "Есть амортизация", isDefault: false },
  { id: 'duration', displayName: "Дюрация, %", isDefault: false },
  { id: 'durationMacaulay', displayName: "Дюрация по Маколею, д.", isDefault: false },
  { id: 'lotSize', displayName: "Размер лота", isDefault: false },
  { id: 'minStep', displayName: "Шаг цены", isDefault: false },
  { id: 'price', displayName: "Тек. цена", isDefault: false },
  { id: 'priceMax', displayName: "Макс. цена", isDefault: false },
  { id: 'priceMin', displayName: "Мин. цена", isDefault: false },
  { id: 'priceStep', displayName: "Стоимость шага цены", isDefault: false },
];
