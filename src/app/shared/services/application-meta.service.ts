import { Injectable, inject } from '@angular/core';
import {LocalStorageService} from "./local-storage.service";
import {Observable, of} from "rxjs";
import {ApplicationMeta} from "../models/application-meta.model";

@Injectable({
  providedIn: 'root'
})
export class ApplicationMetaService {
  private readonly localStorage = inject(LocalStorageService);

  private readonly applicationMetaStorageKey = 'application-meta';

  getMeta(): Observable<ApplicationMeta> {
    const savedMeta = this.getSavedMeta();

    if (savedMeta) {
      return of(savedMeta);
    }

    const defaultMeta = this.getDefaultMeta();
    this.saveMeta(defaultMeta);
    return of(defaultMeta);
  }

  updateLastReset(): void {
    this.saveMeta({
      ...this.getSavedMeta(),
      lastResetTimestamp: Date.now()
    });
  }

  private getSavedMeta(): ApplicationMeta | undefined {
    return this.localStorage.getItem<ApplicationMeta>(this.applicationMetaStorageKey);
  }

  private saveMeta(meta: ApplicationMeta): void {
    this.localStorage.setItem(this.applicationMetaStorageKey, meta);
  }

  private getDefaultMeta(): ApplicationMeta {
    return {} as ApplicationMeta;
  }
}
