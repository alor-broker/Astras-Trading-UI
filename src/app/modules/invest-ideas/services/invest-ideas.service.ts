import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import {
  IdeasPagedResponse,
  Page
} from "./invest-ideas-service-typings";
import {
  Observable,
  of,
  map
} from "rxjs";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { catchHttpError } from "../../../shared/utils/observable-helper";

@Injectable({providedIn: 'root'})
export class InvestIdeasService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly ideasUrl = this.environmentService.investIdeasApiUrl;

  getIdeas(page: Page, language: string | null): Observable<IdeasPagedResponse | null> {
    return this.getIdeasInternal(page, language);
  }

  protected getIdeasInternal(page: Page, language: string | null): Observable<IdeasPagedResponse | null> {
    if(this.ideasUrl.length === 0) {
      return of(null);
    }

    const params: Record<string, string | number> = {
      ...page
    };

    if(language != null) {
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
    pElements.forEach(p => {
      p.replaceWith(p.textContent + '\n');
    });

    let cleanText = tempDiv.textContent || '';

    cleanText = cleanText.replace(/\n{3,}/g, '\n\n');

    return cleanText.trim();
  }
}
