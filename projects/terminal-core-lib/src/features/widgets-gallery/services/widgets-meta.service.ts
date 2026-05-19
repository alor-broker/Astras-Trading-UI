import {
  inject,
  Injectable
} from '@angular/core';
import {WidgetMeta} from './widgets-meta-service.types';
import {
  HttpClient,
  HttpContext
} from '@angular/common/http';
import {HttpContextTokens} from '../../http-requests/constants/http.constants';
import {
  Observable,
  shareReplay
} from 'rxjs';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';

@Injectable({providedIn: 'root'})
export class WidgetsMetaService {
  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private meta$?: Observable<WidgetMeta[] | null>;

  getWidgetsMeta(): Observable<WidgetMeta[] | null> {
    if (!this.meta$) {
      this.readMeta();
    }

    return this.meta$!;
  }

  private readMeta(): void {
    this.meta$ = this.httpClient.get<WidgetMeta[]>(
      'assets/widgets-meta-config.json',
      {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true),
      }
    )
      .pipe(
        catchHttpError<WidgetMeta[] | null>(null, this.errorHandlerService),
        shareReplay(1)
      );
  }
}
