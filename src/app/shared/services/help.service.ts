import { DestroyRef, Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import {
  HttpClient,
  HttpContext
} from "@angular/common/http";
import { map } from "rxjs/operators";
import { Observable, shareReplay } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchHttpError } from "../utils/observable-helper";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { HttpContextTokens } from "../constants/http.constants";

interface HelpDatabaseResponse {
  content: {
    article: {
      properties: {
        properties: {
          jfYn: string; // help link id
          nuQL: string; // widget type name
        };
      };
    };
  }[];
}

interface HelpLinkInfo {
  id: string;
  widgetType: string;
}

@Injectable({
  providedIn: 'root'
})
export class HelpService {

  private readonly helpUrl = environment.externalLinks.help;
  private readonly teamlyDatabaseUrl = environment.teamlyDatabaseUrl;
  private teamlyData$!: Observable<HelpLinkInfo[]>;

  constructor(
    private readonly http: HttpClient,
    private readonly destroyRef: DestroyRef,
    private readonly errorHandlerService: ErrorHandlerService
  ) { }

  getHelpLink(widgetType: string): Observable<string | null> {
    return this.getTeamlyData()
      .pipe(
        map(info => info.find(c => c.widgetType === widgetType) ?? null),
        map(info => {
          if (info == null) {
            return null;
          }

          return this.helpUrl + info.id;
        })
      );
  }

  private getTeamlyData(): Observable<HelpLinkInfo[]> {
    if (this.teamlyData$ == null) {
      this.teamlyData$ = this.http.post<HelpDatabaseResponse>(
        this.teamlyDatabaseUrl,
        {
          query: {
            "__filter": {
              contentDatabaseId: "100970c7-dde3-4404-9d69-0069ce176bfa"
            },
            content: {
              article: {
                properties: {
                  properties: true
                }
              }
            }
          }
        },
        {
          headers: {
            'X-Account-Slug': 'alor'
          },
          context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true)
        }
      )
        .pipe(
          catchHttpError<HelpDatabaseResponse>({ content: [] }, this.errorHandlerService),
          map(res => res.content
            .map(item => item.article.properties.properties)
            .map(item => ({ id: item.jfYn, widgetType: item.nuQL }))
          ),
          shareReplay(1),
          takeUntilDestroyed(this.destroyRef)
        );
    }

    return this.teamlyData$;
  }
}
