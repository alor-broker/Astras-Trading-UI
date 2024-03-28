import { GraphQlEdge, GraphQlPageInfo } from "../../../shared/models/graph-ql.model";

export interface BondScreenerResponse {
  bonds: {
    edges: GraphQlEdge<BondNode>[];
    pageInfo: GraphQlPageInfo;
  };
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
