import { Injectable, inject } from '@angular/core';
import { RemoteStorageService } from "./remote-storage.service";
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  share,
  Subject,
  switchMap,
  take
} from "rxjs";
import { Dashboard } from "../../models/dashboard/dashboard.model";
import {
  debounceTime,
  filter,
  map
} from "rxjs/operators";
import { ApplicationMetaService } from "../application-meta.service";
import { DashboardSettingsDesktopMigrationManager } from "../../../modules/settings-migration/dashboard-settings/dashboard-settings-desktop-migration-manager";
import { GetRecordStatus } from "../../models/settings-broker.model";

export interface ReadDashboardSettingsResult {
  settings: Dashboard[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsBrokerService {
  private readonly remoteStorageService = inject(RemoteStorageService);
  private readonly applicationMetaService = inject(ApplicationMetaService);
  private readonly dashboardSettingsMigrationManager = inject(DashboardSettingsDesktopMigrationManager);

  private readonly saveRequestDelay = 1000;
  private readonly saveQuery$ = new Subject<Dashboard[]>();
  private saveStream$?: Observable<boolean>;

  private get settingsKey(): string {
    return 'dashboards-collection';
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
