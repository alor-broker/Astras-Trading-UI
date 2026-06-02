import {
  Translation,
  TranslocoLoader
} from '@jsverse/transloco';
import {
  inject,
  Injectable
} from '@angular/core';
import {Location} from '@angular/common';
import {
  HttpClient,
  HttpContext
} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpContextTokens} from '../../http-requests/constants/http.constants';

@Injectable()
export class TranslationsLoaderService implements TranslocoLoader {
  private readonly httpClient = inject(HttpClient);
  private readonly location = inject(Location);

  getTranslation(langPath: string): Observable<Translation> {
    const path = langPath.startsWith('/')
      ? langPath.slice(1)
      : langPath;

    return this.httpClient.get<Translation>(
      this.location.prepareExternalUrl(`/assets/i18n/${path}.json`),
      {
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true),
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}
