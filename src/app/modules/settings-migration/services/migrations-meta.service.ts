import { Injectable, inject } from '@angular/core';
import {
  combineLatest,
  forkJoin,
  NEVER,
  Observable,
  of,
  switchMap,
  take
} from "rxjs";
import { MigrationMeta } from "../models/migration.model";
import { map } from "rxjs/operators";
import { RemoteStorageService } from "../../../shared/services/settings-broker/remote-storage.service";
import { ApplicationMetaService } from "../../../shared/services/application-meta.service";
import { CacheService } from "../../../shared/services/cache.service";
import { GuidGenerator } from "../../../shared/utils/guid";

@Injectable({
  providedIn: 'root'
})
export class MigrationsMetaService {
  private readonly remoteStorageService = inject(RemoteStorageService);
  private readonly applicationMetaService = inject(ApplicationMetaService);
  private readonly cacheService = inject(CacheService);

  private readonly migrationsSettingsGroupName = 'migrations';

  getAppliedMigrations(): Observable<MigrationMeta[]> {
    const stream$ = combineLatest({
      applicationMeta: this.applicationMetaService.getMeta(),
      migrations: this.remoteStorageService.getGroup(this.migrationsSettingsGroupName)
    }).pipe(
      switchMap(x => {
        if (x.migrations == null) {
          return NEVER;
        }

        if (x.applicationMeta.lastResetTimestamp != null) {
          if (x.migrations.some(s => x.applicationMeta.lastResetTimestamp! > s.meta.timestamp)) {
            // clean after reset
            return this.remoteStorageService.removeGroup(this.migrationsSettingsGroupName).pipe(
              map(() => [])
            );
          }
        }

        return of(x.migrations.map(x => x.value as MigrationMeta));
      }),
      take(1)
    );

    return this.cacheService.wrap(
      () => 'MigrationsMetaService_getAppliedMigrations',
      () => stream$
    );
  }

  saveAppliedMigrations(migrations: string[]): Observable<boolean> {
    const now = Date.now();
    const saveStreams$ = migrations.map(m => this.remoteStorageService.setRecord(
      {
        key: GuidGenerator.newGuid(),
        meta: {
          timestamp: now
        },
        value: {
          id: m
        } as MigrationMeta
      },
      this.migrationsSettingsGroupName
    ));

    if (saveStreams$.length > 0) {
      return forkJoin(saveStreams$).pipe(
        map(x => x.every(i => i)),
        take(1)
      );
    }

    return of(true);
  }
}
