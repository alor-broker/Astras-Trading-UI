import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, take} from "rxjs";
import {map} from "rxjs/operators";
import {ErrorHandlerService} from "../handle-error/error-handler.service";
import {catchHttpError} from "../../utils/observable-helper";
import {environment} from "../../../../environments/environment";
import {SettingsMeta, SettingsRecord} from "../../models/settings-broker.model";

interface UserSettings {
  Key: string;
  Group?: string;
  Description: string;
  Content: string;
}

interface RemoteStorageItem {
  UserSettings: UserSettings | null;
}

@Injectable({
  providedIn: 'root'
})
export class RemoteStorageService {
  private readonly baseUrl = environment.remoteSettingsStorageUrl;
  private readonly serviceName = 'Astras';

  constructor(
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

  getRecord<T>(key: string): Observable<SettingsRecord<T> | null> {
    return this.httpClient.get<RemoteStorageItem>(
      this.baseUrl,
      {
        params: {
          serviceName: this.serviceName,
          key
        }
      }
    ).pipe(
      catchHttpError<RemoteStorageItem | null>(null, this.errorHandlerService),
      map(r => {
        if (!!r && !!r.UserSettings) {
          try {
            return {
              meta: <SettingsMeta>JSON.parse(r.UserSettings.Description),
              value: <T>JSON.parse(r.UserSettings.Content)
            } as SettingsRecord<T>;
          } catch (e: any) {
            this.errorHandlerService.handleError(e);

            return null;
          }
        }

        return null;
      }),
      take(1)
    );
  }

  getGroup<T>(groupKey: string): Observable<SettingsRecord<T>[] | null> {
    return this.httpClient.get<UserSettings[]>(
      `${this.baseUrl}/group/${groupKey}`,
      {
        params: {
          serviceName: this.serviceName
        }
      }
    ).pipe(
      catchHttpError<UserSettings[] | null>(null, this.errorHandlerService),
      map(r => {
        if (!r) {
          return null;
        }

        try {
          return r.map(i => ({
            meta: <SettingsMeta>JSON.parse(i.Description),
            value: <T>JSON.parse(i.Content)
          } as SettingsRecord<T>));
        } catch (e: any) {
          this.errorHandlerService.handleError(e);

          return null;
        }

      }),
      take(1)
    );
  }

  setRecord<T>(key: string, record: SettingsRecord<T>, groupKey?: string): Observable<boolean> {
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
