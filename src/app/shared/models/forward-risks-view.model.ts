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
}
