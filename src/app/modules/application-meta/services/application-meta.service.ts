import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { merge, Observable, of, shareReplay, Subject, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { ReleaseMeta, ReleasesMeta } from '../models/application-release.model';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { EnvironmentService } from 'src/app/shared/services/environment.service';

@Injectable({
  providedIn: 'root'
})
export class ApplicationMetaService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly releasesApiBaseUrl = `${this.environmentService.warpUrl}/api/releases`;

  private readonly update$ = new Subject();
  private readonly versionStorageKey = 'version';
  readonly savedVersion$ = merge(of({}), this.update$)
    .pipe(
      map(() => {
        return this.localStorageService.getItem<string>(this.versionStorageKey) ?? null;
      }),
      shareReplay(1)
    );

  getCurrentVersion(): Observable<ReleaseMeta | null> {
    return this.httpClient.get<ReleasesMeta>(
      this.releasesApiBaseUrl,
      {
        params: {
          offset: 0,
          limit: 1,
          sortDesc: true,
          selectedService: 'astras',
          locale: 'ru'
        }
      }
    ).pipe(
      catchHttpError<ReleasesMeta | null>(null, this.errorHandlerService),
      map(x => !!x && x.list.length > 0 ? x.list[0] : null),
      take(1)
    );
  }

  updateCurrentVersion(version: string): void {
    this.localStorageService.setItem<string>(this.versionStorageKey, version);
    this.update$.next({});
  }
}
