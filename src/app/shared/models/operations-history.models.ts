export interface HistoryRequestParams {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export interface HistoryItem {
  id: string; // or number, based on V1 response, assuming ID is present
  type: string;
  date: string;
  status: string;
  title?: string; // Derived or backend provided
  data?: any; // Operation specific data
  agreementId?: string;
  // Add other fields as discovered from API response
}

export interface HistoryResponse {
  list: HistoryItem[];
  total?: number; // If API provides it
}
