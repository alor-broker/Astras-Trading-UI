import {
  inject,
  Injectable
} from '@angular/core';
import {
  HttpClient,
  HttpContext
} from '@angular/common/http';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {
  filter,
  Observable,
  shareReplay,
  switchMap
} from 'rxjs';
import {HttpContextTokens} from '@terminal-core-lib/features/http-requests/constants/http.constants';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';

@Injectable()
export class AiChatTermsOfUseService {
  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly translatorService = inject(TranslatorService);

  private content$: Observable<string> | null = null;

  getContent(): Observable<string> {
    this.content$ ??= this.translatorService.getLangChanges().pipe(
      switchMap(lang => {
          return this.httpClient.get(
            `/assets/ai-chat/terms-of-use_${lang}.md`,
            {
              responseType: 'text',
              headers: {
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
              },
              context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true),
            }
          ).pipe(
            catchHttpError<string | null>(null, this.errorHandlerService)
          );
        }
      ),
      filter((x): x is string => x != null),
      shareReplay(1)
    );

    return this.content$;
  }
}
