import {
  inject,
  Injectable
} from '@angular/core';
import {Location} from '@angular/common';
import {WidgetMeta, WidgetMetaConfig} from './widgets-meta-service.types';
import {
  HttpClient,
  HttpContext
} from '@angular/common/http';
import {HttpContextTokens} from '../../http-requests/constants/http.constants';
import {
  Observable,
  map,
  shareReplay
} from 'rxjs';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';

@Injectable({providedIn: 'root'})
export class WidgetsMetaService {
  private readonly httpClient = inject(HttpClient);
  private readonly location = inject(Location);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private meta$?: Observable<WidgetMeta[] | null>;

  getWidgetsMeta(): Observable<WidgetMeta[] | null> {
    if (!this.meta$) {
      this.readMeta();
    }

    return this.meta$!;
  }

  private readMeta(): void {
    this.meta$ = this.httpClient.get<WidgetMetaConfig[]>(
      this.location.prepareExternalUrl('/assets/widgets-meta-config.json'),
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true),
      }
    )
      .pipe(
        map(widgets => widgets.map(widget => ({
          ...widget,
          newUntil: widget.newUntil == null ? widget.newUntil : new Date(widget.newUntil)
        }))),
        catchHttpError<WidgetMeta[] | null>(null, this.errorHandlerService),
        shareReplay(1)
      );
  }
}
