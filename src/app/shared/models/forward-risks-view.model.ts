export interface ForwardRisksView {
  /** Свободные средства **/
  moneyFree: string,
  /** Средства, заблокированные под ГО **/
  moneyBlocked: string,
  /** Списанный сбор **/
  fee: string,
  /** Общее количество средств и залогов на начало сессии **/
  moneyOld: string,
  /** Общее количество средств и залогов **/
  moneyAmount: string,
  /** Сумма залогов **/
  moneyPledgeAmount: string,
  /** Вариационная маржа, списанная или полученная в пром. клиринг **/
  vmInterCl: string,
  /** Сагрегированная вармаржа по текущим позициям **/
  vmCurrentPositions: string,
  /** VmCurrentPositions + VmInterCl **/
  varMargin: string,
  /** Наличие установленных денежного и залогового лимитов **/
  isLimitsSet: boolean
}
