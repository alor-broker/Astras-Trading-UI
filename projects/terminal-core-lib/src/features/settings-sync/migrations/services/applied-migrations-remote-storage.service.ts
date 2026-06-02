import {
  inject,
  Injectable
} from '@angular/core';
import {ApplicationMetaService} from '../../../application-meta/application-meta.service';
import {CacheService} from '../../../../common/services/cache.service';
import {
  combineLatest,
  forkJoin,
  map,
  NEVER,
  Observable,
  of,
  switchMap,
  take
} from "rxjs";
import {MigrationMeta} from '../migration.types';
import {RemoteStorageService} from '../../../remote-storage/remote-storage.service';
import {GuidGenerator} from '../../../../common/utils/guid-generator';

@Injectable()
export class AppliedMigrationsRemoteStorageService {
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
