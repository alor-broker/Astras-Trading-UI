import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ErrorHandlerService} from '../errors-handler/error-handler.service';
import {
  REMOTE_STORAGE_URL_PROVIDER,
  RemoteStorageUrlProvider
} from './remote-storage-url-provider';
import {
  map,
  Observable,
  retry,
  take
} from 'rxjs';
import {
  GetRecordResult,
  GetRecordStatus,
  RecordMeta,
  RemoteStorageItem,
  StorageRecord,
  UserSettings
} from './remote-storage-service.types';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';

@Injectable()
export class RemoteStorageService {
  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly remoteStorageUrlProvider = inject<RemoteStorageUrlProvider>(REMOTE_STORAGE_URL_PROVIDER);

  private readonly baseUrl = this.remoteStorageUrlProvider.remoteSettingsStorageUrl;

  private readonly serviceName = 'Astras';

  getRecord(key: string, retryCount = 3): Observable<GetRecordResult> {
    return this.httpClient.get<RemoteStorageItem>(
      this.baseUrl,
      {
        params: {
          serviceName: this.serviceName,
          key
        }
      }
    ).pipe(
      retry({count: retryCount, delay: 500}),
      catchHttpError<RemoteStorageItem | null>(null, this.errorHandlerService),
      map(r => {
        if (r == null) {
          return {
            status: GetRecordStatus.Error,
            record: null
          };
        }

        if (r.UserSettings == null) {
          return {
            status: GetRecordStatus.NotFound,
            record: null
          };
        }

        try {
          return {
            status: GetRecordStatus.Success,
            record: {
              key: r.UserSettings.Key,
              meta: JSON.parse(r.UserSettings.Description) as RecordMeta,
              value: JSON.parse(r.UserSettings.Content) as unknown
            }
          };
        } catch (e: any) {
          this.errorHandlerService.handleError(e);

          return {
            status: GetRecordStatus.Error,
            record: null
          };
        }
      }),
      take(1)
    );
  }

  getGroup(groupKey: string, retryCount = 3): Observable<StorageRecord[] | null> {
    return this.httpClient.get<UserSettings[]>(
      `${this.baseUrl}/group/${groupKey}`,
      {
        params: {
          serviceName: this.serviceName
        }
      }
    ).pipe(
      retry({count: retryCount, delay: 500}),
      catchHttpError<UserSettings[] | null>(null, this.errorHandlerService),
      map(r => {
        if (!r) {
          return null;
        }

        try {
          return r.map(i => ({
            key: i.Key,
            meta: JSON.parse(i.Description) as RecordMeta,
            value: JSON.parse(i.Content) as unknown
          }));
        } catch (e: any) {
          this.errorHandlerService.handleError(e);

          return null;
        }
      }),
      take(1)
    );
  }

  setRecord(record: StorageRecord, groupKey?: string): Observable<boolean> {
    return this.httpClient.put(
      this.baseUrl,
      {
        description: JSON.stringify(record.meta),
        content: JSON.stringify(record.value),
        group: groupKey
      },
      {
        params: {
          serviceName: this.serviceName,
          key: record.key
        },
        responseType: 'text'
      },
    ).pipe(
      map(() => true),
      catchHttpError<boolean>(false, this.errorHandlerService),
      take(1)
    );
  }

  removeRecord(key: string): Observable<boolean> {
    return this.httpClient.delete(
      this.baseUrl,
      {
        params: {
          serviceName: this.serviceName,
          key: key
        },
        responseType: 'text'
      },
    ).pipe(
      map(() => true),
      catchHttpError<boolean>(false, this.errorHandlerService),
      take(1)
    );
  }

  removeGroup(groupKey: string): Observable<boolean> {
    return this.httpClient.delete(
      `${this.baseUrl}/group/${groupKey}`,
      {
        params: {
          serviceName: this.serviceName
        },
        responseType: 'text'
      },
    ).pipe(
      map(() => true),
      catchHttpError<boolean>(false, this.errorHandlerService),
      take(1)
    );
  }
}
