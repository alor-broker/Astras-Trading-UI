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

  fortsMoneyDebt?: number | null;
}
