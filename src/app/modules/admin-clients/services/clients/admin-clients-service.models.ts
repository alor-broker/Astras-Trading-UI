import {
  Exchange,
  Market
} from "../../../../../generated/graphql.types";
import { ClientRiskType } from "../../../../shared/models/enums/client-risk-type";

export interface PageFilter {
  page: number;
  pageSize: number;
}

interface ClientFilterFields {
  market: string;
  clientName: string;
  login: string;
  portfolio: string;
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
  clientName: string;
  portfolio: string;
  exchange: Exchange;
  login: string;
  isQualifiedInvestor: boolean;
  clientRiskType: ClientRiskType;
  market: Market;
  spectraExtension: SpectraExtension | null;
}

export interface SortParams {
  sortBy: string;
  desc: boolean;
}

export interface ClientsSearchResponse {
  items: Client[];
  total: number;
}
