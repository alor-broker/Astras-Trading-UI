import { Injectable } from '@angular/core';
import { Observable, shareReplay, take } from "rxjs";
import { TranslatorFn, TranslatorService } from "./translator.service";

@Injectable({
  providedIn: 'root'
})
export abstract class BaseTranslatorService {
  protected translator$?: Observable<TranslatorFn>;
  protected translationsPath = '';

  constructor(
    protected readonly translatorService: TranslatorService
  ) { }

  protected withTranslation(showNotificationCallback: (t: TranslatorFn) => void): void {
    this.getTranslatorFn()
      .pipe(take(1))
      .subscribe(t => {
        showNotificationCallback(t);
      });
  }

  protected getTranslatorFn(): Observable<TranslatorFn> {
    if (this.translator$ == null) {
      this.translator$ = this.translatorService.getTranslator(this.translationsPath)
        .pipe(shareReplay(1));
    }

    return this.translator$;
  }
}
