export interface BlotterSettings {
  title?: string,
  exchange: string,
  portfolio: string,
  linkToActive?: boolean,
  ordersColumns: string[],
  tradesColumns: string[],
  positionsColumns: string[],
  guid: string
}

export interface ColumnIds  {
  columnId: string,
  name: string
}

export const allOrdersColumns: ColumnIds[] = [
  { columnId: 'id', name: "Номер" },
  { columnId: 'symbol', name: "Тикер" },
  { columnId: 'side', name: "Сторона" },
  { columnId: 'status', name: "Статус" },
  { columnId: 'qty', name: "Кол-во" },
  { columnId: 'residue', name: "Остаток" },
  { columnId: 'volume', name: "Объем" },
  { columnId: 'price', name: "Цена" },
  { columnId: 'transTime', name: 'Время' },
  { columnId: 'exchange', name: "Биржа" },
  { columnId: 'type', name: "Тип" },
  { columnId: 'endTime', name: "Действ. до" },
]

export const allPositionsColumns: ColumnIds[] = [
  { columnId: 'symbol', name: "Тикер" },
  { columnId: 'shortName', name: "Имя" },
  { columnId: 'avgPrice', name: "Средняя" },
  { columnId: 'qtyT0', name: "T0" },
  { columnId: 'qtyT1', name: "T1" },
  { columnId: 'qtyT2', name: "T2" },
  { columnId: 'qtyTFuture', name: "TFuture" }
]

export const allTradesColumns: ColumnIds[] = [
  { columnId: 'id', name: "Номер" },
  { columnId: 'orderno', name: "Заявка" },
  { columnId: 'symbol', name: "Тикер" },
  { columnId: 'side', name: "Сторона" },
  { columnId: 'price', name: "Цена" },
  { columnId: 'qty', name: "Кол-во" },
  { columnId: 'date', name: 'Время' }
]
