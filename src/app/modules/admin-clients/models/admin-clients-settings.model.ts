import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import {
  BaseColumnId,
  TableDisplaySettings
} from "../../../shared/models/settings/table-settings.model";

export interface AdminClientsSettings extends WidgetSettings {
  table: TableDisplaySettings;
  refreshIntervalSec: number;
}

export const AdminClientsTableColumns: BaseColumnId[] = [
  { id: "login", isDefault: true},
  { id: "clientName", isDefault: true},
  { id: "portfolio", isDefault: true},
  { id: "exchange", isDefault: true},
  { id: "market", isDefault: true},
  { id: "clientRiskType", isDefault: false},
  { id: "isQualifiedInvestor", isDefault: false},
  { id: "buyingPowerAtMorning", isDefault: false},
  { id: "buyingPower", isDefault: false},
  { id: "profit", isDefault: false},
  { id: "profitRate", isDefault: false},
  { id: "portfolioEvaluation", isDefault: false},
  { id: "portfolioLiquidationValue", isDefault: false},
  { id: "initialMargin", isDefault: false},
  { id: "minimalMargin", isDefault: false},
  { id: "riskBeforeForcePositionClosing", isDefault: false},
  { id: "commission", isDefault: false},
  { id: "correctedMargin", isDefault: false},
  { id: "turnover", isDefault: false},
  { id: "moneyFree", isDefault: false},
  { id: "moneyOld", isDefault: false},
  { id: "moneyBlocked", isDefault: false},
  { id: "isLimitsSet", isDefault: false},
  { id: "moneyAmount", isDefault: false},
  { id: "moneyPledgeAmount", isDefault: false},
  { id: "vmCurrentPositions", isDefault: false},
  { id: "varMargin", isDefault: false},
  { id: "netOptionValue", isDefault: false},
  { id: "indicativeVarMargin", isDefault: false},
  { id: "fee", isDefault: false},
  { id: "vmInterCl", isDefault: false},
  { id: "posRisk", isDefault: false}
];
