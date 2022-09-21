import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FeedbackMeta,
  NewFeedback,
  SendFeedBackRequest,
  SendFeedBackResponse,
  UnansweredFeedback
} from '../models/feedback.model';
import {
  Observable,
  take
} from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { catchHttpError } from '../../../shared/utils/observable-helper';

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

  setLastFeedbackCheck() {
    const meta = this.getSavedFeedbackMeta() ?? {};
    this.saveFeedbackMeta({
      ...meta,
      lastCheck: Date.now()
    });
  }

  setUnansweredFeedback(unansweredFeedback: UnansweredFeedback) {
    const meta = this.getSavedFeedbackMeta() ?? {};
    this.saveFeedbackMeta({
      ...meta,
      lastUnansweredFeedback: unansweredFeedback
    });
  }

  removeUnansweredFeedback() {
    const meta = this.getSavedFeedbackMeta() ?? {};
    this.saveFeedbackMeta({
      ...meta,
      lastUnansweredFeedback: undefined
    });
  }

  submitFeedback(feedback: SendFeedBackRequest): Observable<SendFeedBackResponse> {
    return this.httpClient.post<SendFeedBackResponse>(
      `${this.baseUrl}/rates`,
      feedback
    ).pipe(
      take(1)
    );
  }

  requestFeedback(): Observable<NewFeedback | null> {
    return this.httpClient.get<NewFeedback | null>(`${this.baseUrl}/rates/actions/getNewRequest`).pipe(
      catchHttpError<NewFeedback | null>(null, this.errorHandlerService),
      take(1)
    );
  }

  getSavedFeedbackMeta(): FeedbackMeta | null {
    return this.localStorage.getItem<FeedbackMeta>(this.feedbackLocalStorageKey) ?? null;
  }

  private saveFeedbackMeta(meta: FeedbackMeta) {
    this.localStorage.setItem(this.feedbackLocalStorageKey, meta);
  }
}
