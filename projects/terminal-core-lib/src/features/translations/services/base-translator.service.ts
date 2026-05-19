import {
  Observable,
  shareReplay,
  take
} from 'rxjs';
import {TranslatorFn} from './translator-service.types';
import {TranslatorService} from './translator.service';
import {inject} from '@angular/core';

export abstract class BaseTranslatorService {
  protected translator$?: Observable<TranslatorFn>;

  protected readonly translatorService = inject(TranslatorService)

  protected abstract translationsPath: string;

  protected withTranslation(showNotificationCallback: (t: TranslatorFn) => void): void {
    this.getTranslatorFn()
      .pipe(take(1))
      .subscribe(t => {
        showNotificationCallback(t);
      });
  }

  protected getTranslatorFn(): Observable<TranslatorFn> {
    this.translator$ ??= this.translatorService.getTranslator(this.translationsPath)
      .pipe(shareReplay(1));

    return this.translator$;
  }
}
