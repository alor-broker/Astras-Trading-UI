import {
  DestroyRef,
  inject,
  Injectable
} from '@angular/core';
import {Dashboard} from "@terminal-core-lib/features/dashboard/types/dashboard.types";
import {GetRecordStatus} from "@terminal-core-lib/features/remote-storage/remote-storage-service.types";
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  map,
  Observable,
  of,
  share,
  Subject,
  switchMap,
  take
} from "rxjs";
import {RemoteStorageService} from '@terminal-core-lib/features/remote-storage/remote-storage.service';
import {ApplicationMetaService} from '@terminal-core-lib/features/application-meta/application-meta.service';
import {DASHBOARD_SETTINGS_DESKTOP_MIGRATION_MANAGER} from '@terminal-core-lib/features/settings-sync/migrations/settings-migrations.providers';
import {MigrationManagerBase} from '@terminal-core-lib/features/settings-sync/migrations/migration-manager-base';

export interface ReadDashboardSettingsResult {
  settings: Dashboard[];
}

@Injectable()
export class DashboardsSettingsBrokerService {
  private readonly remoteStorageService = inject(RemoteStorageService);

  private readonly applicationMetaService = inject(ApplicationMetaService);

  private readonly dashboardSettingsMigrationManager = inject<MigrationManagerBase>(DASHBOARD_SETTINGS_DESKTOP_MIGRATION_MANAGER);

  private readonly destroyRef = inject(DestroyRef);

  private readonly saveRequestDelay = 1000;

  private readonly saveQuery$ = new Subject<Dashboard[]>();

  private saveStream$?: Observable<boolean>;

  private get settingsKey(): string {
    return 'dashboards-collection';
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.saveQuery$.complete());
  }

  readSettings(): Observable<ReadDashboardSettingsResult | null> {
    const settings$ = this.remoteStorageService.getRecord(this.settingsKey).pipe(
      take(1)
    );

    return combineLatest([
      this.applicationMetaService.getMeta(),
      settings$
    ]).pipe(
      switchMap(([meta, settings]) => {
        if (settings.status === GetRecordStatus.Error) {
          return of(null);
        }

        if (settings.status === GetRecordStatus.NotFound || settings.record == null) {
          return of({
            settings: []
          });
        }

        if (meta.lastResetTimestamp != null) {
          if (meta.lastResetTimestamp > settings.record.meta.timestamp) {
            return of({
              settings: []
            });
          }
        }

        return this.dashboardSettingsMigrationManager.applyMigrations<Dashboard[]>(
          settings.record.value,
          migrated => this.saveSettings(migrated)
        ).pipe(
          map(x => ({
            settings: x.updatedData
          }))
        );
      }),
      take(1)
    );
  }

  saveSettings(settings: Dashboard[]): Observable<boolean> {
    this.saveStream$ ??= this.saveQuery$.pipe(
      debounceTime(this.saveRequestDelay),
      switchMap(query => this.setRemoteRecord(query)),
      share()
    );

    const result$ = new BehaviorSubject<boolean | null>(null);

    this.saveStream$.pipe(
      take(1)
    ).subscribe(x => {
      result$.next(x);
      result$.complete();
    });

    this.saveQuery$.next(settings);

    return result$.pipe(
      filter((x): x is boolean => x != null)
    );
  }

  private setRemoteRecord(settings: Dashboard[]): Observable<boolean> {
    return this.remoteStorageService.setRecord(
      {
        key: this.settingsKey,
        meta: {
          timestamp: this.getTimestamp()
        },
        value: settings
      });
  }

  private getTimestamp(): number {
    return Date.now();
  }
}
