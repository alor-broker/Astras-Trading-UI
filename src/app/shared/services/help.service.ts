import { Injectable } from '@angular/core';
import { environment } from "../../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

interface HelpDatabaseResponse {
  id: string;
  title: string;
  archived: boolean;
  schemaProperties: {
    id: string;
    spaceId: string;
    propertyId: string;
    name: string;
    type: string;
    code: string;
    format: string;
  }[];
  content: {
    article: {
      properties: {
        properties: {
          a8Kv: {
            id: string;
            name: string;
            surname: string;
            fullName: string;
            avatarPath: string | null;
            externalId: string | null;
          }[];
          fxJo: string | null;
          jfYn: string; // help link id
          nuQL: string; // widget type name
          title: {
            icon: string | null;
            text: string | null;
          };
          author: {
            id: string;
            fullName: string;
            avatarPath: string | null;
            externalId: string | null;
          };
        };
      };
    };
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class HelpService {

  private readonly helpUrl = environment.externalLinks.help;
  private readonly teamlyDatabaseUrl = environment.teamlyDatabaseUrl;

  constructor(
    private readonly http: HttpClient
  ) { }

  getHelpLink(widgetType: string): Observable<string | null> {
    const httpOptions = {
      headers: new HttpHeaders({
        'X-Account-Slug': 'alor'
      })
    };

    const body = {
      "query": {
        "__filter": {
          "contentDatabaseId": "100970c7-dde3-4404-9d69-0069ce176bfa"
        },
        "id": true,
        "title": true,
        "archived": true,
        "schemaProperties": {
          "id": true,
          "spaceId": true,
          "propertyId": true,
          "name": true,
          "type": true,
          "code": true,
          "format": true
        },
        "content": {
          "article": {
            "properties": {
              "properties": true
            }
          }
        }
      }
    };

    return this.http.post<HelpDatabaseResponse>(this.teamlyDatabaseUrl, body, httpOptions)
      .pipe(
        map(res => res.content.find(c => c.article.properties.properties.nuQL === widgetType) ?? null),
        map(info => {
          if (info == null) {
            return null;
          }

          return this.helpUrl + info.article.properties.properties.jfYn;
        })
      );
  }
}
