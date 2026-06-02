export interface CommonSummaryView {
  /** покупательная способности на утро **/
  buyingPowerAtMorning: string;
  /** покупательная способность **/
  buyingPower: string;
  /** прибыль **/
  profit: string;
  /** % прибыли **/
  profitRate: number;
  /** оценка ликвидного портфеля **/
  portfolioEvaluation: string;
  /**  оценка ликвидационной стоймости портфеля **/
  portfolioLiquidationValue: string;
  /** начальная маржа **/
  initialMargin: string;
  /** Скорректированная маржа **/
  correctedMargin: string;
  /** НПР2 **/
  riskBeforeForcePositionClosing: string;
  /** Комиссия **/
  commission: string;

  derivativesDebt: string;
  hasDerivativesDebt: boolean;
}

export interface ForwardRisksView {
  /** Свободные средства **/
  moneyFree: string;
  /** Средства, заблокированные под ГО **/
  moneyBlocked: string;
  /** Списанный сбор **/
  fee: string;
  /** Общее количество средств и залогов на начало сессии **/
  moneyOld: string;
  /** Общее количество средств и залогов **/
  moneyAmount: string;
  /** Сумма залогов **/
  moneyPledgeAmount: string;
  /** Вариационная маржа, списанная или полученная в пром. клиринг **/
  vmInterCl: string;
  /** Сагрегированная вармаржа по текущим позициям **/
  vmCurrentPositions: string;
  /** VmCurrentPositions + VmInterCl **/
  varMargin: string;
  /** Наличие установленных денежного и залогового лимитов **/
  isLimitsSet: boolean;
  /** Индикативная маржа **/
  indicativeVarMargin: string;
  /** NOV: (net option value) **/
  netOptionValue: number;
  /** Опер риск  **/
  posRisk: string;
  /** Стоимость ликвидного портфеля  **/
  portfolioLiquidationValue: string;
  /** Начальная маржа **/
  initialMargin: string;
  /** Минимальная маржа **/
  minimalMargin: string;
  /** Скорр. Маржа **/
  correctedMargin: string;
  /** НПР1 **/
  riskCoverageRatioOne: string;
  /** НПР2 **/
  riskCoverageRatioTwo: string;
  /** Статус **/
  riskStatus: string;
  /** Уровень риска **/
  clientType: string;
  /** оценка ликвидного портфеля **/
  portfolioEvaluation: string;

  derivativesDebt: string;
  hasDerivativesDebt: boolean;
}
