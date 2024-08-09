import {Injectable} from '@angular/core';
import {Observable, shareReplay} from "rxjs";
import {WidgetMeta} from "../models/widget-meta.model";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class WidgetsMetaService {
  private meta$?: Observable<WidgetMeta[]>;

  constructor(private readonly httpClient: HttpClient) {
  }

  getWidgetsMeta(): Observable<WidgetMeta[]> {
    if (!this.meta$) {
      this.readMeta();
    }

    return this.meta$!;
  }

  private readMeta(): void {
    this.meta$ = this.httpClient.get<WidgetMeta[]>(
      '../../../assets/widgets-meta-config.json',
      {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      }
    )
      .pipe(
        shareReplay(1)
      );
  }
}
