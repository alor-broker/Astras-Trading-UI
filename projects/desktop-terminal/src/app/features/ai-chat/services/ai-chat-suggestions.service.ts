import {
  inject,
  Injectable
} from '@angular/core';
import {Location} from '@angular/common';
import {
  HttpClient,
  HttpContext
} from '@angular/common/http';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {
  combineLatest,
  map,
  Observable,
  take
} from 'rxjs';
import {HttpContextTokens} from '@terminal-core-lib/features/http-requests/constants/http.constants';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {startOfToday} from 'date-fns';

interface Suggestion {
  lang: string;
  text: string;
}

@Injectable()
export class AiChatSuggestionsService {
  private readonly httpClient = inject(HttpClient);
  private readonly location = inject(Location);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly translatorService = inject(TranslatorService);

  getSuggestions(): Observable<string[] | null> {
    const allSuggestions$ = this.httpClient.get<Suggestion[]>(
      this.location.prepareExternalUrl('/assets/ai-chat/request-suggestions.json'),
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true),
      }
    ).pipe(
      catchHttpError<Suggestion[] | null>(null, this.errorHandlerService),
      take(1)
    );

    return combineLatest({
      lang: this.translatorService.getLangChanges(),
      allSuggestions: allSuggestions$
    }).pipe(
      map(x => {
        if (x.allSuggestions == null) {
          return null;
        }

        const context: Record<string, string> = {
          today: startOfToday().toLocaleDateString()
        };

        return x.allSuggestions
          .filter((suggestion: Suggestion) => suggestion.lang === x.lang)
          .map(s => {
            return Object.keys(context)
              .reduce(
                (acc, key) => {
                  return acc.replace(`{{${key}}}`, context[key]);
                },
                s.text
              );
          });
      })
    );
  }
}
