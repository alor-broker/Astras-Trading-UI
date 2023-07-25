import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, take} from "rxjs";
import {map} from "rxjs/operators";
import {ErrorHandlerService} from "../handle-error/error-handler.service";
import {catchHttpError} from "../../utils/observable-helper";
import {RemoteStorageItem, RemoteStorageItemMeta} from "../../models/remote-storage.model";
import {environment} from "../../../../environments/environment";

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

  addRecord(meta: string, content: string): Observable<boolean> {
    return this.httpClient.post(
      this.baseUrl,
      {
        description: meta,
        content
      },
      {
        params: {
          serviceName: this.serviceName
        },
        responseType: 'text'
      }
    ).pipe(
      map(() => true),
      catchHttpError<boolean>(false, this.errorHandlerService),
      take(1)
    );
  }

  removeRecord(id: string): Observable<boolean> {
    return this.httpClient.delete(
      this.baseUrl,
      {
        params: {
          serviceName: this.serviceName,
          id
        },
        responseType: 'text'
      }
    ).pipe(
      map(() => true),
      catchHttpError<boolean>(false, this.errorHandlerService),
      take(1)
    );
  }

  getExistedRecordsMeta(): Observable<RemoteStorageItemMeta[] | null> {
    return this.httpClient.get<RemoteStorageItemMeta[]>(
      `${this.baseUrl}/description`,
      {
        params: {
          serviceName: this.serviceName
        }
      }
    ).pipe(
      catchHttpError<RemoteStorageItemMeta[] | null>(null, this.errorHandlerService),
      take(1)
    );
  }

  readSettings(id: string): Observable<RemoteStorageItem | null> {
    return this.httpClient.get<RemoteStorageItem>(
      this.baseUrl,
      {
        params: {
          serviceName: this.serviceName,
          id
        }
      }
    ).pipe(
      catchHttpError<RemoteStorageItem | null>(null, this.errorHandlerService),
      take(1)
    );
  }
}
