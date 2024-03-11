export interface BondScreenerResponse {
  bonds: {
    edges: BondEdge[];
    pageInfo: PageInfo;
  };
}

export interface BondEdge {
  node: BondNode;
  cursor: string;
}

export interface BondNode {
  basicInformation: {
    symbol: string;
    shortName?: string;
    exchange: string;
  };
  financialAttributes?: {
    tradingStatusInfo?: string;
  };
  additionalInformation?: {
    cancellation?: Date;
    priceMultiplier?: number;
  };
  boardInformation?: {
    board?: string;
  };
  tradingDetails?: {
    lotSize?: number;
    minStep?: number;
    priceMax?: number;
    priceMin?: number;
    priceStep?: number;
    rating?: number;
  };
  volumes?: {
    issueValue: string;
  };
  couponRate?: string;
  couponType?: string;
  guaranteed?: boolean;
  hasOffer?: boolean;
  maturityDate?: Date;
  placementEndDate?: Date;
  yield?: {
    currentYield?: number;
  };
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string;
}

export interface BondScreenerFilters {
  and?: (BondScreenerFilter | BondScreenerFilters)[];
  or?: (BondScreenerFilter | BondScreenerFilters)[];
}

export interface BondScreenerFilter {
  [filterName: string]: FilterCondition | BondScreenerFilter | BondScreenerFilters;
}

export interface FilterCondition {
  [conditionType: string]: unknown;
}
