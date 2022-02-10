export interface SummaryView {
    /** покупательная способности на утро **/
    buyingPowerAtMorning: string,
    /** покупательная способность **/
    buyingPower: string,
    /** прибыль **/
    profit: string,
    /** % прибыли **/
    profitRate: number,
    /** оценка ликвидного портфеля **/
    portfolioEvaluation: string,
    /**  оценка ликвидационной стоймости портфеля **/
    portfolioLiquidationValue: string,
    /** начальная маржа **/
    initialMargin: string,
    /** НПР2 **/
    riskBeforeForcePositionClosing: string,
    /** Комиссия **/
    commission: string
}
