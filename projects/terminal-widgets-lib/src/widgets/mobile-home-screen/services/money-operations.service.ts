import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
  Observable,
  of
} from 'rxjs';
import {
  catchError,
  map,
  take
} from 'rxjs/operators';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {CLIENT_DATA_URLS_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {ErrorHandlerService} from "@terminal-core-lib/features/errors-handler/error-handler.service";
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {
  BankInfoResponse,
  BankRequisitesResponse,
  CreateOperationCommand,
  CreateOperationResponse,
  OperationTypes,
  PrepareOperationCommand,
  PrepareOperationResponse,
  WithdrawalSubmitParams,
  WithdrawCreateOperationData
} from "../types/money-operations.types";
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {DEBUG_CONFIG} from '@terminal-core-lib/config/debug-config';

export interface WithdrawalResult {
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MoneyOperationsService {
  private readonly clientDataUrlsProvider = inject(CLIENT_DATA_URLS_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly notificationService = inject(NzNotificationService);

  private readonly translatorService = inject(TranslatorService);

  private readonly debugConfig = inject(DEBUG_CONFIG);

  private readonly baseUrl = `${this.clientDataUrlsProvider.clientDataUrl}/client/v2.0/operations`;

  private readonly agreementsV2BaseUrl = `${this.clientDataUrlsProvider.clientDataUrl}/client/v2.0/agreements`;

  private readonly agreementsBaseUrl = `${this.clientDataUrlsProvider.clientDataUrl}/client/v1.0/agreements`;

  private readonly originatorHeaders = {
    'X-ALOR-Originator': 'astras'
  };

  validateOperation(command: PrepareOperationCommand): Observable<PrepareOperationResponse | null> {
    return this.httpClient.post<PrepareOperationResponse>(
      `${this.baseUrl}/prepare`,
      command,
      {
        headers: this.originatorHeaders
      }
    ).pipe(
      catchHttpError<PrepareOperationResponse | null>(null, this.errorHandlerService)
    );
  }

  submitOperation(command: CreateOperationCommand): Observable<CreateOperationResponse | null> {
    const formData = new FormData();
    formData.append('operationType', command.operationType);
    formData.append('agreementNumber', command.agreementNumber);
    formData.append('data', JSON.stringify(command.data));

    return this.httpClient.post<CreateOperationResponse>(
      `${this.baseUrl}/create`,
      formData,
      {
        headers: this.originatorHeaders
      }
    ).pipe(
      catchHttpError<CreateOperationResponse | null>(null, this.errorHandlerService)
    );
  }

  getTopUpPaymentDetails(operationId: string): Observable<Record<string, string> | null> {
    return this.httpClient.get<Record<string, string>>(
      `${this.baseUrl}/${operationId}/actions/get-money-input`
    ).pipe(
      map(config => {
        if (config != null) {
          delete config['MNT_RETURN_URL'];
          delete config['MNT_SUCCESS_URL'];
          delete config['MNT_FAIL_URL'];
        }
        return config;
      }),
      catchHttpError<Record<string, string> | null>(null, this.errorHandlerService)
    );
  }

  getBankInfoByBic(bic: string): Observable<BankInfoResponse | null> {
    return this.httpClient.get<BankInfoResponse>(
      `${this.agreementsBaseUrl}/bank/${bic}`,
      {
        headers: this.originatorHeaders
      }
    ).pipe(
      catchHttpError<BankInfoResponse | null>(null, this.errorHandlerService)
    );
  }

  getAgreementBankRequisites(
    agreementNumber: string,
    currency = 'RUB',
    offset = 0,
    limit = 7
  ): Observable<BankRequisitesResponse | null> {
    return this.httpClient.get<BankRequisitesResponse>(
      `${this.agreementsV2BaseUrl}/${agreementNumber}/bank-requisites`,
      {
        headers: this.originatorHeaders,
        params: {
          currency,
          offset,
          limit
        }
      }
    ).pipe(
      map(response => ({
        ...response,
        list: [...response.list].sort((a, b) => b.id - a.id)
      })),
      catchHttpError<BankRequisitesResponse | null>(null, this.errorHandlerService)
    );
  }

  submitWithdrawalOperation(params: WithdrawalSubmitParams): Observable<CreateOperationResponse | null> {
    const data: WithdrawCreateOperationData = {
      recipient: params.recipient,
      account: params.portfolio,
      currency: params.currency ?? 'RUB',
      subportfolioFrom: params.exchange,
      amount: params.amount,
      bic: params.bic,
      bankName: params.bankName,
      loroAccount: params.loroAccount,
      settlementAccount: params.settlementAccount
    };

    const command: CreateOperationCommand = {
      operationType: OperationTypes.Withdraw,
      agreementNumber: params.agreementNumber,
      data
    };

    return this.submitOperation(command);
  }

  submitWithdrawalWithNotification(params: WithdrawalSubmitParams): Observable<WithdrawalResult> {
    return this.submitWithdrawalOperation(params).pipe(
      take(1),
      catchError(() => of(null)),
      map(res => {
        this.handleWithdrawalResponse(res);
        return {success: res?.success === true};
      })
    );
  }

  generatePaymentSystemUrl(params: Record<string, string>): string {
    const isDebug = this.debugConfig.payments ?? false;
    const baseUrl = isDebug
      ? 'https://demo.moneta.ru/assistant.htm'
      : 'https://www.payanyway.ru/assistant.htm';

    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    return `${baseUrl}?${queryString}`;
  }

  private handleWithdrawalResponse(res: CreateOperationResponse | null): void {
    this.translatorService.getTranslator('money-operations').pipe(
      take(1)
    ).subscribe(translator => {
      const getText = (key: string, fallback: string): string => {
        const scopePath = 'moneyOperations.';
        const translated = translator([key]);
        return translated !== `${scopePath}${key}` ? translated : fallback;
      };

      if (res != null && res.success) {
        this.notificationService.success(
          getText('withdrawSubmitSuccessTitle', 'Request submitted'),
          getText('withdrawSubmitSuccessMessage', 'Your withdrawal request has been sent for processing.')
        );
        return;
      }

      if (res != null) {
        const validationMessage = res.validations
          ?.filter(v => !v.isSuccess)
          .map(v => v.message)
          .join('\n');
        const errorText = validationMessage
          ?? res.errorMessage
          ?? res.message
          ?? getText('withdrawSubmitErrorMessage', 'Could not submit your withdrawal request. Please try again.');

        this.notificationService.error(
          getText('withdrawSubmitErrorTitle', 'Failed to submit request'),
          errorText
        );
      }
    });
  }
}
