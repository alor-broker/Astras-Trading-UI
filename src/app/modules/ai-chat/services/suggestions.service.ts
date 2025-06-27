import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { TranslatorService } from "../../../shared/services/translator.service";
import {
  combineLatest,
  Observable,
  take
} from "rxjs";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { map } from "rxjs/operators";
import { startOfToday } from "date-fns";

interface Suggestion {
  lang: string;
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuggestionsService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly translatorService: TranslatorService
  ) {
  }

  getSuggestions(): Observable<string[] | null> {
    const allSuggestions$ = this.httpClient.get<Suggestion[]>('/assets/ai-chat/request-suggestions.json').pipe(
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

        const context = {
          today: startOfToday().toLocaleDateString()
        };

        return x.allSuggestions
          .filter((suggestion: Suggestion) => suggestion.lang === x.lang)
          .map(s => {
            return Object.keys(context)
              .reduce(
                (acc, key) => {
                  return acc.replace(`{{${key}}}`, (context as any)[key]);
                },
                s.text
              );
          });
      })
    );
  }
}
