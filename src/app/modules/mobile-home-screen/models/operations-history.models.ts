export interface HistoryFilterParams {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
  searchType?: HistorySearchType;
}

export type HistorySearchType = 'deal' | 'moneymove' | 'operation';

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
  price?: number;
  extCurrency?: string | null;
}

export interface HistoryItemBase {
  id: string;
  type: string;
  date: string;
  status: string;
  statusName?: string;
  icon?: string;
  title?: string;
  subType?: string;
  data?: HistoryItemData;
  documents?: unknown[];
  files?: unknown[];
  refuseReason?: string | null;
  cancelling?: boolean;
  agreementId?: string;
}

export interface MoneyMoveHistoryItem extends HistoryItemBase {
  type: 'moneymove';
  sum?: number;
  currency?: string;
}

export interface OperationHistoryItem extends HistoryItemBase {
  type: 'operation';
}

export type HistoryItem = MoneyMoveHistoryItem | OperationHistoryItem;

export interface HistoryResponse {
  list: HistoryItem[];
  total?: number;
}
