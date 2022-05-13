import { WidgetSettings } from "../widget-settings.model";

export interface BlotterSettings extends WidgetSettings {
  activeTabIndex: number,
  exchange: string,
  portfolio: string,
  currency: string,
  ordersColumns: string[],
  stopOrdersColumns: string[],
  tradesColumns: string[],
  positionsColumns: string[],
  isSoldPositionsHidden: boolean
}

export interface ColumnIds  {
  columnId: string,
  name: string,
  isDefault: boolean
}

export const allOrdersColumns: ColumnIds[] = [
  { columnId: 'id', name: "Номер", isDefault: false },
  { columnId: 'symbol', name: "Тикер", isDefault: true  },
  { columnId: 'side', name: "Сторона", isDefault: false  },
  { columnId: 'status', name: "Статус", isDefault: true  },
  { columnId: 'qty', name: "Кол-во", isDefault: false  },
  { columnId: 'residue', name: "Остаток", isDefault: true  },
  { columnId: 'volume', name: "Объем", isDefault: true  },
  { columnId: 'price', name: "Цена", isDefault: true  },
  { columnId: 'transTime', name: 'Время', isDefault: true  },
  { columnId: 'exchange', name: "Биржа", isDefault: false  },
  { columnId: 'type', name: "Тип", isDefault: false  },
  { columnId: 'endTime', name: "Действ. до", isDefault: false  },
];

export const allStopOrdersColumns: ColumnIds[] = [
  ...allOrdersColumns,
  { columnId: 'triggerPrice', name: "Сигнальная цена", isDefault: true  },
  { columnId: 'conditionType', name: "Условие", isDefault: true  },
];

export const allPositionsColumns: ColumnIds[] = [
  { columnId: 'symbol', name: "Тикер", isDefault: true  },
  { columnId: 'shortName', name: "Имя", isDefault: true  },
  { columnId: 'avgPrice', name: "Средняя", isDefault: true  },
  { columnId: 'qtyT0', name: "T0", isDefault: false  },
  { columnId: 'qtyT1', name: "T1", isDefault: false  },
  { columnId: 'qtyT2', name: "T2", isDefault: true  },
  { columnId: 'qtyTFuture', name: "TFuture", isDefault: false  },
  { columnId: 'volume', name: "Объем", isDefault: false  },
  { columnId: 'unrealisedPl', name: "P/L всего", isDefault: true  },
  { columnId: 'dailyUnrealisedPl', name: "P/L дн.", isDefault: false  },
];

export const allTradesColumns: ColumnIds[] = [
  { columnId: 'id', name: "Номер", isDefault: false  },
  { columnId: 'orderno', name: "Заявка", isDefault: false  },
  { columnId: 'symbol', name: "Тикер", isDefault: true  },
  { columnId: 'side', name: "Сторона", isDefault: true  },
  { columnId: 'price', name: "Цена", isDefault: true  },
  { columnId: 'qty', name: "Кол-во", isDefault: true  },
  { columnId: 'date', name: 'Время', isDefault: false  },
  { columnId: 'volume', name: 'Объем', isDefault: false  }
];
