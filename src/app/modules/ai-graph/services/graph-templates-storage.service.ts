import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpContext
} from "@angular/common/http";
import {
  Observable,
  shareReplay
} from "rxjs";
import { GraphTemplate } from "../models/graph-template.model";
import { HttpContextTokens } from "../../../shared/constants/http.constants";

@Injectable({
  providedIn: 'root'
})
export class GraphTemplatesStorageService {
  private readonly httpClient = inject(HttpClient);

  private allTemplates$: Observable<GraphTemplate[]> | null = null;

  getAllTemplates(): Observable<GraphTemplate[]> {
    this.allTemplates$ ??= this.httpClient.get<GraphTemplate[]>(
      './assets/ai-graph-templates.json',
      {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true),
      }
    )
      .pipe(
        shareReplay(1)
      );

    return this.allTemplates$;
  }
}
