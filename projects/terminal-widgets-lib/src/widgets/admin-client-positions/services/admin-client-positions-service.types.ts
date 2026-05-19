export interface PageFilter {
  page: number;
  pageSize: number;
}

export interface SortParams {
  sortBy: string;
  desc: boolean;
}

interface PositionFilterFields {
  symbol: string;
  exchange: string;
  excludeClosedPositions: boolean;
}

export type PositionsSearchFilter = Partial<PositionFilterFields>;

export interface ClientPosition {
  symbol: string;
  exchange: string;
  portfolio: string;
  quantityT0: number;
}

export interface PositionsSearchResponse {
  items: ClientPosition[];
  total: number;
}
