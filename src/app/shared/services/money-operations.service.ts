import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentService } from './environment.service';
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { catchHttpError } from '../utils/observable-helper';
import {
  CreateOperationCommand,
  CreateOperationResponse,
  PrepareOperationCommand,
  PrepareOperationResponse
} from '../models/money-operations.models';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MoneyOperationsService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly baseUrl = `${this.environmentService.clientDataUrl}/client/v2.0/operations`;

  prepare(command: PrepareOperationCommand): Observable<PrepareOperationResponse | null> {
    return this.httpClient.post<PrepareOperationResponse>(
      `${this.baseUrl}/prepare`,
      command,
      {
        headers: {
          'X-ALOR-Originator': 'astras'
        }
      }
    ).pipe(
      catchHttpError<PrepareOperationResponse | null>(null, this.errorHandlerService)
    );
  }

  create(command: CreateOperationCommand): Observable<CreateOperationResponse | null> {
    const formData = new FormData();
    formData.append('operationType', command.operationType);
    formData.append('agreementNumber', command.agreementNumber);
    formData.append('data', command.data);

    return this.httpClient.post<CreateOperationResponse>(
      `${this.baseUrl}/create`,
      formData,
      {
        headers: {
          'X-ALOR-Originator': 'astras'
        }
      }
    ).pipe(
      catchHttpError<CreateOperationResponse | null>(null, this.errorHandlerService)
    );
  }

  getPaymentConfig(operationId: string): Observable<Record<string, string> | null> {
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

  getMonetaUrl(params: Record<string, string>): string {
    const isProd = this.environmentService.production;
    // Using hardcoded URL based on spec/const.js logic.
    // Spec said: Concatenate https://www.payanyway.ru/assistant.htm (Prod) with the query string parameters
    const baseUrl = isProd
      ? 'https://www.payanyway.ru/assistant.htm'
      : 'https://demo.moneta.ru/assistant.htm';

    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    return `${baseUrl}?${queryString}`;
  }
}
