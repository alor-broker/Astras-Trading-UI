import { HttpClient } from '@angular/common/http';
import {
  provideTransloco,
  Translation,
  TranslocoLoader,
  TranslocoModule
} from '@ngneat/transloco';
import {
  Injectable,
  NgModule
} from '@angular/core';
import { environment } from '../environments/environment';
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private readonly http: HttpClient) {
  }

  getTranslation(lang: string): Observable<Translation> {
    return this.http.get<Translation>(
      `/assets/i18n/${lang}.json`,
      {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      }
    );
  }
}

@NgModule({
  exports: [TranslocoModule],
  providers: [
    provideTransloco({
      config: {
        availableLangs: ['ru', 'en'],
        defaultLang: 'ru',
        reRenderOnLangChange: true,
        prodMode: environment.production,
      },
      loader: TranslocoHttpLoader
    })
  ]
})
export class TranslocoRootModule {
}
