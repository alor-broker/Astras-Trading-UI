import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import {
  IdeasPagedResponse,
  Page
} from "./invest-ideas-service-typings";
import {
  Observable,
  of
} from "rxjs";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { catchHttpError } from "../../../shared/utils/observable-helper";

@Injectable({providedIn: 'root'})
export class InvestIdeasService {
  private readonly ideasUrl = this.environmentService.investIdeasApiUrl;
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) { }

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
      catchHttpError<IdeasPagedResponse | null>(null, this.errorHandlerService)
    );
  }
}
