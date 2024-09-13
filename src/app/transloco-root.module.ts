import {
  HttpClient,
  HttpContext
} from '@angular/common/http';
import {
  provideTransloco,
  Translation,
  TRANSLOCO_MISSING_HANDLER,
  TranslocoConfig,
  TranslocoLoader,
  TranslocoMissingHandler,
  TranslocoModule
} from '@jsverse/transloco';
import {
  Injectable,
  NgModule
} from '@angular/core';
import { environment } from '../environments/environment';
import { Observable } from "rxjs";
import { HashMap } from "@jsverse/transloco/lib/types";
import { HttpContextTokens } from "./shared/constants/http.constants";

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private readonly http: HttpClient) {
  }

  getTranslation(langPath: string): Observable<Translation> {
    const path = langPath.startsWith('/')
      ? langPath.slice(1)
      : langPath;

    return this.http.get<Translation>(
      `/assets/i18n/${path}.json`,
      {
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true),
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      }
    );
  }
}

class CustomHandler implements TranslocoMissingHandler {
  handle(key: string, config: TranslocoConfig, params?: HashMap): string {
    return (params?.fallback ?? '') as string;
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
    }),
    {
      provide: TRANSLOCO_MISSING_HANDLER,
      useClass: CustomHandler
    },
  ]
})
export class TranslocoRootModule {
}
