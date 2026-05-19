import {
  inject,
  Injectable
} from '@angular/core';
import {
  Observable,
  shareReplay
} from 'rxjs';
import {DashboardTemplateConfig} from './dashboard-templates-service.types';
import {
  HttpClient,
  HttpContext
} from '@angular/common/http';
import {HttpContextTokens} from '../../http-requests/constants/http.constants';

@Injectable({providedIn: 'root'})
export class DashboardTemplatesService {
  private readonly httpClient = inject(HttpClient);

  private defaultConfig$?: Observable<DashboardTemplateConfig[]>;

  getDashboardTemplatesConfig(): Observable<DashboardTemplateConfig[]> {
    if (!this.defaultConfig$) {
      this.readTemplatesConfig();
    }

    return this.defaultConfig$!;
  }

  private readTemplatesConfig(): void {
    this.defaultConfig$ = this.httpClient.get<DashboardTemplateConfig[]>(
      '/assets/default-dashboards-config.json',
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
  }
}
