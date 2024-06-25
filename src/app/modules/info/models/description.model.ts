export enum FutureType {
  Settlement = 'settlement',
  Deliverable = 'deliverable',
  NonDeliverable = 'nonDeliverable'
}

export interface Description {
  description: string; // "Публичное акционерное общество «Сбербанк России» — российский финансовый конгломерат, крупнейший транснациональный и универсальный банк Российской Федерации — России, Центральной и Восточной Европы. По итогам 2019 года у «Сбербанка» 96,2 млн активных частных клиентов и 2,6 млн активных корпоративных клиентов. ",
  sector: string; // "Финансы",
  isin: string; //"RU0009029540",
  baseCurrency: string; // "RUB",
  securityType: string; // "stock"
  lotsize: number; // "10"
  priceStep: number;
  expirationDate: Date | null;
  marginbuy?: number;
  marginsell?: number;
  cfiCode: string | null;
}
