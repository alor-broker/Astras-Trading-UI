import { Injectable, inject } from '@angular/core';
import {EnvironmentService} from "../../../shared/services/environment.service";
import {HttpClient} from "@angular/common/http";
import {ErrorHandlerService} from "../../../shared/services/handle-error/error-handler.service";
import {Observable, take} from "rxjs";
import {catchHttpError} from "../../../shared/utils/observable-helper";

export interface QueryResponse {
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class LLMService {
  private readonly httpClient = inject(HttpClient);
  private readonly environmentService = inject(EnvironmentService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly baseUrl = `${this.environmentService.apiUrl}/aichat/openrouter`;

  sendQuery(query: string): Observable<QueryResponse | null> {
    return this.httpClient.post<QueryResponse>(
      this.baseUrl,
      {
        query,
      }
    ).pipe(
      catchHttpError<QueryResponse | null>(null, this.errorHandlerService),
      take(1)
    );
  }
}
