export interface PrepareOperationCommand {
  operationType: OperationType;
  agreementNumber: string;
  data: PrepareOperationData;
}

export interface DepositPrepareOperationData {
  amount: number;
  currency: string;
  subtype: OperationSubtype;
}

export interface DepositCreateOperationData {
  account: string;
  exchange: string;
  amount: number;
  currency: string;
  paymentMethod: OperationSubtype;
}

export interface WithdrawCreateOperationData {
  recipient: string;
  account: string;
  currency: string;
  subportfolioFrom: string;
  amount: number;
  bic: string;
  bankName: string;
  loroAccount: string;
  settlementAccount: string;
}

export interface TransferOperationData {
  amount: number;
  currency: string;
}

export type PrepareOperationData = DepositPrepareOperationData | TransferOperationData;
export type CreateOperationData = DepositCreateOperationData | WithdrawCreateOperationData | TransferOperationData;
export type OperationData = PrepareOperationData | CreateOperationData;

export interface WithdrawalSubmitParams {
  agreementNumber: string;
  portfolio: string;
  exchange: string;
  recipient: string;
  bic: string;
  bankName: string;
  loroAccount: string;
  settlementAccount: string;
  amount: number;
  currency?: string;
}

export interface PrepareOperationResponse {
  title: string;
  data: any;
  validations?: ValidationResult[];
}

export interface ValidationResult {
  message: string;
  isSuccess: boolean;
}

export interface CreateOperationCommand {
  operationType: OperationType;
  agreementNumber: string;
  data: CreateOperationData;
}

export interface CreateOperationResponse {
  operationId: string;
  success: boolean;
  message?: string;
  validations?: ValidationResult[];
  formErrors?: Record<string, string>;
  errorMessage?: string | null;
}

export interface BankInfoResponse {
  id: number;
  bank: string;
  zip: string;
  tnp: string;
  nnp: string;
  bankAddress: string;
  ks: string;
  bik: string;
  dateDel: string;
}

export interface BankRequisiteItem {
  id: number;
  clientId: number;
  rating: number;
  deleted: boolean;
  currency: string;
  recipient: string;
  bic: string;
  bankName: string;
  loroAccount: string;
  settlementAccount: string;
  cardNumber: string | null;
  bankTaxNumber: string | null;
  personalAccount: string | null;
  swift: string | null;
  correspondingSWIFT: string | null;
  correspondingBankName: string | null;
  alias: string | null;
}

export interface BankRequisitesResponse {
  list: BankRequisiteItem[];
  total: number;
}

export type OperationType = 'money_input' | 'money_withdrawal' | 'money_between_accounts' | 'money_between_subportfolios' | 'money_between_agreements';

export type OperationSubtype = 'card' | 'sbp';

export const OperationTypes = {
  Deposit: 'money_input' as OperationType,
  Withdraw: 'money_withdrawal' as OperationType,
  Transfer: {
    Account: 'money_between_accounts' as OperationType,
    Portfolios: 'money_between_subportfolios' as OperationType,
    Agreements: 'money_between_agreements' as OperationType,
  }
};

export const OperationSubtypes = {
  Card: 'card' as OperationSubtype,
  Sbp: 'sbp' as OperationSubtype,
};

export const Currencies = {
  Rub: 'RUB'
};
