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
  amortizations?: Amortization[];
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
    price?: number;
    minStep?: number;
    priceMax?: number;
    priceMin?: number;
    priceStep?: number;
    rating?: number;
  };
  coupons?: BondCoupon[];
  offers?: BondOffer[];
  volumes?: {
    issueValue: string;
  };
  couponRate?: string;
  couponType?: string;
  guaranteed?: boolean;
  hasOffer?: boolean;
  maturityDate?: Date;
  placementEndDate?: Date;
  durationMacaulay?: number;
  duration?: number;
  yield?: {
    currentYield?: number;
  };
}

export interface BondCoupon {
  accruedInterest?: number;
  amount?: number;
  couponRate?: number;
  couponType?: string;
  currency?: string;
  date: Date;
  fixDate?: Date;
  intervalInDays?: number;
  value?: number;
}

export interface BondOffer {
  date: Date;
}

export interface Amortization {
  date: number;
}
