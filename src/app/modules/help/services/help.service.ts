import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';
import { environment } from 'src/environments/environment';
import { HelpResponse } from '../models/help-response.model';

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  private url = environment.apiUrl + '/astras/helptopics';

  constructor(private http: HttpClient) { }
  markdown = `## Markdown __is awesome__!
  ---
  ### Different text
  _italic_
  **bold**
  [Alor](https://alorbroker.ru).
  ### Lists
  1. Ordered list
  2. Another bullet point
     - Unordered list
     - Another unordered bullet

  ### Blockquote
  > Blockquote to the max
  ### Images
  ![The San Juan Mountains are beautiful!](https://storage.alorbroker.ru/icon/SBER.png "San Juan Mountains")
  `;

  getHelp(widgetType: string) : Observable<HelpResponse> {
    return this.http.get<HelpResponse>(`${this.url}/${widgetType}`);
  }
}
