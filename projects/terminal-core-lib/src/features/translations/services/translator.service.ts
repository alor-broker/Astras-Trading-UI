import {
  TranslocoEvents,
  TranslocoService
} from '@jsverse/transloco';
import {inject} from '@angular/core';
import {
  map,
  Observable
} from 'rxjs';
import {TranslatorFn} from './translator-service.types';
import {HashMap} from '@jsverse/transloco/lib/utils/type.utils';

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
    return this.translocoService.selectTranslate('', {}, {scope}).pipe(
      map(() =>
        (key: string[], params?: HashMap) =>
          this.translocoService.translate(
            this.getTranslationPath(
              scopePath ? [scopePath] : [],
              key
            ),
            params
          )
      )
    );
  }

  private getTranslationPath(scope: string[], property: string[]): string {
    const scopeStr = scope.length
      ? scope
      .join('/')
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index == 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+|_|-|\//g, '') + '.'
      : '';

    return `${scopeStr}${property.join('.')}`;
  }
}
