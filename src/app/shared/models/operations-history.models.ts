export interface HistoryRequestParams {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export interface HistoryItemData {
  order?: string;
  amount?: number;
  accountFrom?: string;
  accountTo?: string;
  subportfolioFrom?: string;
  subportfolioTo?: string;
  currency?: string;
  currencyExchange?: string;
  accountNumber?: string;
  orderType?: string;
  issuer?: string;
  price?: string | number;
  extCurrency?: string | null;
}

export interface HistoryItem {
  id: string;
  type: string;
  date: string;
  status: string;
  statusName?: string;
  icon?: string;
  title?: string;
  subType?: string;
  data?: HistoryItemData;
  documents?: any[];
  files?: any[];
  refuseReason?: string | null;
  cancelling?: boolean;
  agreementId?: string;
}

export interface HistoryResponse {
  list: HistoryItem[];
  total?: number;
}
