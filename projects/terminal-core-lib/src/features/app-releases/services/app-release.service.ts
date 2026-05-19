import {
  inject,
  Injectable,
  OnDestroy
} from '@angular/core';
import {RELEASES_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {LocalStorageService} from '../../local-storage/local-storage.service';
import {HttpClient} from '@angular/common/http';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {
  BehaviorSubject,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  take
} from "rxjs";
import {
  ReleaseMeta,
  ReleasesMeta
} from './app-releases-service.types';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';

@Injectable({providedIn: 'root'})
export class AppReleaseService implements OnDestroy {
  private readonly releasesApiUrlProvider = inject(RELEASES_API_URL_PROVIDER);

  private readonly localStorageService = inject(LocalStorageService);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly releasesApiBaseUrl = this.releasesApiUrlProvider.releasesApi;

  private readonly update$ = new Subject();

  private readonly versionStorageKey = 'version';

  readonly savedVersion$ = merge(of({}), this.update$)
    .pipe(
      map(() => {
        return this.localStorageService.getItem<string>(this.versionStorageKey) ?? null;
      }),
      shareReplay(1)
    );

  private readonly appUpdatedDialogParamsSub = new BehaviorSubject<ReleaseMeta | null>(null);

  readonly appUpdatedDialogParams$ = this.appUpdatedDialogParamsSub.asObservable();

  ngOnDestroy(): void {
    this.appUpdatedDialogParamsSub.complete();
  }

  showAppUpdatedDialog(params: ReleaseMeta): void {
    this.appUpdatedDialogParamsSub.next(params);
  }

  closeAppUpdatedDialog(): void {
    this.appUpdatedDialogParamsSub.next(null);
  }

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
