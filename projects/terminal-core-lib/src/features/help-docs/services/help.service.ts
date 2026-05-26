import {
  inject,
  Injectable
} from '@angular/core';
import {Location} from '@angular/common';
import {
  HttpClient,
  HttpContext
} from '@angular/common/http';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {EXTERNAL_LINKS_CONFIG} from '../../external-links/external-links.types';
import {
  filter,
  map,
  Observable,
  shareReplay,
  take
} from 'rxjs';
import {HelpLinks} from './help-service.types';
import {HttpContextTokens} from '../../http-requests/constants/http.constants';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';

@Injectable({providedIn: 'root'})
export class HelpService {
  protected readonly externalLinksConfig = inject(EXTERNAL_LINKS_CONFIG);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly location = inject(Location);

  private readonly helpUrl = this.externalLinksConfig.help;

  private helpLinks: Observable<HelpLinks> | null = null;

  getWidgetHelp(widgetId: string): Observable<string | null> {
    return this.getHelpLinks().pipe(
      map(helpLinks => {
        const helpLink = helpLinks.widgets[widgetId] as string | undefined;
        if (helpLink == null) {
          return null;
        }

        return this.getHelpLink(helpLink);
      }),
      shareReplay(1),
      take(1)
    );
  }

  getSectionHelp(sectionId: string): Observable<string | null> {
    return this.getHelpLinks().pipe(
      map(helpLinks => {
        const helpLink = helpLinks.sections[sectionId] as string | undefined;
        if (helpLink == null) {
          return null;
        }

        return this.getHelpLink(helpLink);
      }),
      shareReplay(1),
      take(1)
    );
  }

  private getHelpLinks(): Observable<HelpLinks> {
    this.helpLinks ??= this.httpClient.get<HelpLinks>(
      this.location.prepareExternalUrl('/assets/help-links.json'),
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true),
      }
    ).pipe(
      catchHttpError<HelpLinks | null>(null, this.errorHandlerService),
      filter((helpLinks): helpLinks is HelpLinks => helpLinks != null),
      shareReplay(1)
    );

    return this.helpLinks;
  }

  private getHelpLink(link: string): string {
    if (link.startsWith('/')) {
      return `${this.helpUrl}${link}`;
    }

    return link;
  }
}
