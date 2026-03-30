import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpContext
} from "@angular/common/http";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { TranslatorService } from "../../../shared/services/translator.service";
import {
  filter,
  Observable
} from "rxjs";
import {
  shareReplay,
  switchMap
} from "rxjs/operators";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { HttpContextTokens } from "../../../shared/constants/http.constants";

@Injectable({
  providedIn: 'root'
})
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
