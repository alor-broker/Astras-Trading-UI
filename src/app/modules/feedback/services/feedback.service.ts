import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  NewFeedback,
  SendFeedBackRequest,
  SendFeedBackResponse
} from '../models/feedback.model';
import {
  Observable,
  take
} from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { catchHttpError } from '../../../shared/utils/observable-helper';

interface FeedbackMeta {
  lastCheck?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private readonly baseUrl = environment.apiUrl + '/astras';
  private readonly feedbackLocalStorageKey = 'feedback';

  constructor(
    private readonly httpClient: HttpClient,
    private readonly localStorage: LocalStorageService,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

  getLastFeedbackCheck(): number | null {
    const lastCheck = this.getSavedFeedbackMeta()?.lastCheck ?? null;

    if (lastCheck) {
      return lastCheck;
    }

    return null;
  }

  setLastFeedbackCheck() {
    const lastCheck = this.getSavedFeedbackMeta()?.lastCheck ?? {};
    this.saveFeedbackMeta({
      ...lastCheck,
      lastCheck: Date.now()
    });
  }

  submitFeedback(feedback: SendFeedBackRequest): Observable<SendFeedBackResponse> {
    return this.httpClient.post<SendFeedBackResponse>(
      `${this.baseUrl}/rates`,
      feedback
    );
  }

  requestFeedback(): Observable<NewFeedback | null> {
    return this.httpClient.get<NewFeedback | null>(`${this.baseUrl}/rates/actions/getNewRequest`).pipe(
      catchHttpError<NewFeedback | null>(null, this.errorHandlerService),
      take(1)
    );
  }

  private getSavedFeedbackMeta(): FeedbackMeta | null {
    return this.localStorage.getItem<FeedbackMeta>(this.feedbackLocalStorageKey) ?? null;
  }

  private saveFeedbackMeta(meta: FeedbackMeta) {
    this.localStorage.setItem(this.feedbackLocalStorageKey, meta);
  }
}
