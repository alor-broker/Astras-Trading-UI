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
  Subject,
  take
} from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { map } from 'rxjs/operators';
import { LocalStorageCommonConstants } from "../../../shared/constants/local-storage.constants";

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  unansweredFeedbackRemoved$ = new Subject();
  private readonly baseUrl = environment.apiUrl + '/astras';

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

  setUnansweredFeedback(unansweredFeedback: UnansweredFeedback | null) {
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

    this.setLastFeedbackCheck();
    this.unansweredFeedbackRemoved$.next({});
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
      map(x => {
        if (!x) {
          return null;
        }

        if (!x.code || !x.description) {
          return null;
        }

        return x;
      }),
      take(1)
    );
  }

  getSavedFeedbackMeta(): FeedbackMeta | null {
    return this.localStorage.getItem<FeedbackMeta>(LocalStorageCommonConstants.FeedbackStorageKey) ?? null;
  }

  private saveFeedbackMeta(meta: FeedbackMeta) {
    this.localStorage.setItem(LocalStorageCommonConstants.FeedbackStorageKey, meta);
  }
}
