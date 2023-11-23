import { Injectable } from '@angular/core';
import {
  asyncScheduler,
  Observable,
  observeOn,
  shareReplay,
  tap
} from 'rxjs';

export interface CacheOptions {
  expirationTimeoutSec: number;
}

interface CachedData {
  expirationTime?: Date;
  data$: Observable<any>;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly loadedData = new Map<string, CachedData>();

  wrap<T>(
    getKey: () => string,
    loadData: () => Observable<T>,
    options: CacheOptions | null = {
      expirationTimeoutSec: 30
    }
  ): Observable<T> {
    const key = getKey();
    const loadedData = this.loadedData.get(key);
    if (loadedData) {
      if (!loadedData.expirationTime || loadedData.expirationTime > (new Date())) {
        return loadedData.data$ as Observable<T>;
      }
    }

    const dataStream$ = loadData().pipe(
      tap((value) => {
        if (!value) {
          this.loadedData.delete(key);
          return;
        }

        const data = this.loadedData.get(key);
        if (data) {
          const expirationTime = new Date();
          expirationTime.setSeconds(expirationTime.getSeconds() + (options?.expirationTimeoutSec ?? 30));

          data.expirationTime = expirationTime;
        }
      }),
      shareReplay(1),
      observeOn(asyncScheduler)
    );

    this.loadedData.set(key, { data$: dataStream$ });

    return dataStream$;
  }
}
