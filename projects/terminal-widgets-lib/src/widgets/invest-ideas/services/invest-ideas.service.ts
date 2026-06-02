import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {
  IdeasPagedResponse,
  INVEST_IDEAS_URL_PROVIDER,
  Page
} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas-service.types';
import {
  Observable,
  of
} from 'rxjs';
import {map} from 'rxjs/operators';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';

@Injectable({providedIn: 'root'})
export class InvestIdeasService {
  private readonly investIdeasUrlProvider = inject(INVEST_IDEAS_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly ideasUrl = this.investIdeasUrlProvider.investIdeasApiUrl;

  getIdeas(page: Page, language: string | null): Observable<IdeasPagedResponse | null> {
    return this.getIdeasInternal(page, language);
  }

  protected getIdeasInternal(page: Page, language: string | null): Observable<IdeasPagedResponse | null> {
    if (this.ideasUrl.length === 0) {
      return of(null);
    }

    const params: Record<string, string | number> = {
      ...page
    };

    if (language != null) {
      params.language = language.toUpperCase();
    }

    return this.httpClient.get<IdeasPagedResponse>(
      this.ideasUrl,
      {
        params
      }
    ).pipe(
      map(response => {
        response.list = response.list.map(idea => ({
          ...idea,
          body: this.sanitizeHtmlContent(idea.body)
        }));

        return response;
      }),
      catchHttpError<IdeasPagedResponse | null>(null, this.errorHandlerService)
    );
  }

  private sanitizeHtmlContent(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const brElements = tempDiv.querySelectorAll('br');
    brElements.forEach(br => {
      br.replaceWith('\n');
    });

    const pElements = tempDiv.querySelectorAll('p');
    pElements.forEach((p, index) => {
      p.replaceWith(p.textContent + '\n'.repeat(index < 1 ? index : 2));
    });

    let cleanText = tempDiv.textContent || '';

    cleanText = cleanText.replace(/\n{3,}/g, '\n\n');

    return cleanText.trim();
  }
}
