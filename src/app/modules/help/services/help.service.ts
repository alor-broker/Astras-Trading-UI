import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';
import { environment } from 'src/environments/environment';
import { HelpResponse } from '../models/help-response.model';

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  private url = environment.apiUrl + '/astras/v2/helptopics';

  constructor(private http: HttpClient) { }
  getHelp(widgetType: string) : Observable<HelpResponse> {
    return this.http.get<HelpResponse>(`${this.url}/${widgetType}`);
  }
}
