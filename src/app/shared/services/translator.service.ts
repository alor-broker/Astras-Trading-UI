import { Injectable, inject } from '@angular/core';
import { Observable } from "rxjs";
import { TranslocoEvents, TranslocoService } from "@jsverse/transloco";
import { map } from "rxjs/operators";
import { getTranslationPath } from "../utils/translation-helper";
import { HashMap } from "node_modules/@jsverse/transloco/lib/utils/type.utils";

export type TranslatorFn = (key: string[], params?: HashMap) => string;

@Injectable({
  providedIn: 'root'
})
export class TranslatorService {
  private readonly translocoService = inject(TranslocoService);

  getActiveLang(): string {
    return this.translocoService.getActiveLang();
  }

  setActiveLang(lang: string): void {
    this.translocoService.setActiveLang(lang);
  }

  getLangChanges(): Observable<string> {
    return this.translocoService.langChanges$;
  }

  getEvents(): Observable<TranslocoEvents> {
    return this.translocoService.events$;
  }

  getTranslator(scope: string): Observable<TranslatorFn> {
    const scopePath = scope.length ? scope + '/' : '';
    return this.translocoService.selectTranslate('', {}, { scope }).pipe(
      map(() =>
        (key: string[], params?: HashMap) =>
          this.translocoService.translate(
            getTranslationPath(
              scopePath ? [scopePath] : [],
              key
            ),
            params
          )
      )
    );
  }
}
