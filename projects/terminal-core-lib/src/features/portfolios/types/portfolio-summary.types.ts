export interface CommonSummaryModel {
  /** покупательная способности на утро **/
  buyingPowerAtMorning: number;
  /** покупательная способность **/
  buyingPower: number;
  /** прибыль **/
  profit: number;
  /** % прибыли **/
  profitRate: number;
  /** оценка ликвидного портфеля **/
  portfolioEvaluation: number;
  /**  оценка ликвидационной стоймости портфеля **/
  portfolioLiquidationValue: number;
  /** начальная маржа **/
  initialMargin: number;
  /** Скорректированная маржа **/
  correctedMargin: number;
  /** НПР2 **/
  riskBeforeForcePositionClosing: number;
  /** Комиссия **/
  commission: number;

  derivativesDebt?: number | null;
}

export interface ForwardRisks {
  /** Свободные средства **/
  moneyFree: number;
  /** Средства, заблокированные под ГО **/
  moneyBlocked: number;
  /** Списанный сбор **/
  fee: number;
  /** Общее количество рублей и дисконтированных в рубли залогов на начало сессии **/
  moneyOld: number;
  /** Общее количество рублей и дисконтированных в рубли залогов **/
  moneyAmount: number;
  /** Сумма залогов, дисконтированных в рубли **/
  moneyPledgeAmount: number;
  /** Вариационная маржа, списанная или полученная в пром. клиринг **/
  vmInterCl: number;
  /** Сагрегированная вармаржа по текущим позициям **/
  vmCurrentPositions: number;
  /** VmCurrentPositions + VmInterCl **/
  varMargin: number;
  /** Наличие установленных денежного и залогового лимитов **/
  isLimitsSet: boolean;
  /** Индикативная маржа **/
  indicativeVarMargin: number;
  /** NOV: (net option value) **/
  netOptionValue: number;
  /** Опер риск **/
  posRisk: number;

  derivativesDebt?: number | null;
}

export interface Risks {
  portfolio: string;
  exchange: string;
  portfolioEvaluation: number;
  portfolioLiquidationValue: number;
  initialMargin: number;
  minimalMargin: number;
  correctedMargin: number;
  riskCoverageRatioOne: number;
  riskCoverageRatioTwo: number;
  riskCategoryId: number;
  // StandardRisk, HighRisk, Special, LowRisk
  clientType: string;
  hasForbiddenPositions: boolean;
  hasNegativeQuantity: boolean;
  // Ok, Demand, ToClose
  riskStatus: string;
}
