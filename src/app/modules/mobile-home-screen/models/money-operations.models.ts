export interface PrepareOperationCommand {
  operationType: OperationType;
  agreementNumber: string;
  data: OperationData;
}

export interface OperationData {
  amount?: number;
  currency: string;
  subtype?: OperationSubtype;
  [key: string]: any;
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
  data: OperationData;
}

export interface CreateOperationResponse {
  operationId: string;
  success: boolean;
  message?: string;
}

export type OperationType = 'money_input' | 'money_withdrawal' | 'money_between_accounts' | 'money_between_subportfolios' | 'money_between_agreements';

export type OperationSubtype = 'card' | 'sbp' | 'transfer';

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

export const Limits = {
  Card: {
    Min: 50,
    Max: 500_000,
    Commission: 0.023
  },
  Sbp: {
    Min: 1,
    Max: 999_999,
    Commission: 0.004
  }
};
