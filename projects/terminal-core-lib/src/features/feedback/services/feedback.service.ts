import {
  inject,
  Injectable,
  OnDestroy
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subject,
  take
} from 'rxjs';
import {map} from 'rxjs/operators';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {LocalStorageService} from '../../local-storage/local-storage.service';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {
  FeedbackMeta,
  NewFeedback,
  SendFeedBackRequest,
  SendFeedBackResponse,
  UnansweredFeedback
} from '../types/feedback.types';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';
import {LocalStorageCommonConstants} from '../../local-storage/local-storage.constants';

@Injectable()
export class FeedbackService implements OnDestroy {
  unansweredFeedbackRemoved$ = new Subject();

  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly localStorage = inject(LocalStorageService);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly voteParamsSub = new BehaviorSubject<NewFeedback | null>(null);

  public readonly voteParams$ = this.voteParamsSub.asObservable();

  private readonly baseUrl = this.coreApiUrlProvider.apiUrl + '/astras';

  ngOnDestroy(): void {
    this.voteParamsSub.complete();
  }

  showVoteDialog(params: NewFeedback): void {
    this.voteParamsSub.next(params);
  }

  closeVoteDialog(): void {
    this.voteParamsSub.next(null);
  }

  setLastFeedbackCheck(): void {
    const meta = this.getSavedFeedbackMeta() ?? {};
    this.saveFeedbackMeta({
      ...meta,
      lastCheck: Date.now()
    });
  }

  setUnansweredFeedback(unansweredFeedback: UnansweredFeedback | null): void {
    const meta = this.getSavedFeedbackMeta() ?? {};
    this.saveFeedbackMeta({
      ...meta,
      lastUnansweredFeedback: unansweredFeedback
    });
  }

  removeUnansweredFeedback(): void {
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

  private saveFeedbackMeta(meta: FeedbackMeta): void {
    this.localStorage.setItem(LocalStorageCommonConstants.FeedbackStorageKey, meta);
  }
}
