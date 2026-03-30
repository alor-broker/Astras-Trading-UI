import { Injectable, inject } from '@angular/core';
import { environment } from "../../../environments/environment";
import {
  HttpClient,
  HttpContext
} from "@angular/common/http";
import {
  filter,
  map
} from "rxjs/operators";
import {
  Observable,
  shareReplay,
  take
} from "rxjs";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { HttpContextTokens } from "../constants/http.constants";
import { catchHttpError } from "../utils/observable-helper";

interface HelpLinks {
  widgets: Record<string, string>;
  sections: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly helpUrl = environment.externalLinks.help;

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
      '/assets/help-links.json',
      {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
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
