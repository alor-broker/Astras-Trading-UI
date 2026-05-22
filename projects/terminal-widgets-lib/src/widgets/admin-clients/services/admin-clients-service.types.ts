import {
  Exchange,
  Market
} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';

export enum ClientRiskType {
  StandardRisk = 'StandardRisk',
  HighRisk = 'HighRisk',
  Special = 'Special',
  LowRisk = 'LowRisk'
}

export interface PageFilter {
  page: number;
  pageSize: number;
}

interface ClientFilterFields {
  market: string;
  clientName: string;
  login: string;
  portfolio: string;
  favoritePortfoliosOnly: boolean;
  excludeZeroPortfolioValuation: boolean;
}

export type ClientsSearchFilter = Partial<ClientFilterFields>;

export interface SpectraExtension {
  moneyFree: number;
  moneyOld: number;
  moneyBlocked: number;
  isLimitsSet: boolean;
  moneyAmount: number;
  moneyPledgeAmount: number;
  vmCurrentPositions: number;
  varMargin: number;
  netOptionValue: number;
  indicativeVarMargin: number;
  fee: number;
  vmInterCl: number;
  posRisk: number;
}

export interface Client {
  buyingPowerAtMorning: number;
  buyingPower: number;
  profit: number;
  profitRate: number;
  portfolioEvaluation: number;
  portfolioLiquidationValue: number;
  initialMargin: number;
  minimalMargin: number;
  riskBeforeForcePositionClosing: number;
  commission: number;
  correctedMargin: number;
  turnover: number;
  clientId: string;
  clientName: string;
  portfolio: string;
  exchange: Exchange;
  login: string;
  isQualifiedInvestor: boolean;
  clientRiskType: ClientRiskType;
  market: Market;
  spectraExtension: SpectraExtension | null;
  isFavorite: boolean;
}

export interface SortParams {
  sortBy: string;
  desc: boolean;
}

export interface ClientsSearchResponse {
  items: Client[];
  total: number;
}

export enum RestrictionOrigin {
  Manual = 'Manual',
  SocialRating = 'SocialRating',
  Error = 'Error'
}

export interface ClientRestriction {
  restrictionOrigin: RestrictionOrigin;
  expiresAt?: Date;
  reason?: string;
  comment?: string;
  additionalContext?: string;
}
