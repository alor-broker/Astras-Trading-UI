/**
 * Агрегированные данные по портфелю
 */
export interface Summary {
  /** покупательная способности на утро **/
  buyingPowerAtMorning: number,
  /** покупательная способность **/
  buyingPower: number,
  /** прибыль **/
  profit: number,
  /** % прибыли **/
  profitRate: number,
  /** оценка ликвидного портфеля **/
  portfolioEvaluation: number,
  /**  оценка ликвидационной стоймости портфеля **/
  portfolioLiquidationValue: number,
  /** начальная маржа **/
  initialMargin: number,
  /** НПР2 **/
  riskBeforeForcePositionClosing: number,
  /** Комиссия **/
  commission: number
}
