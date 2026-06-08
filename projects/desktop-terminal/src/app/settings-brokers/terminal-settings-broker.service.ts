import {
  DestroyRef,
  inject,
  Injectable
} from '@angular/core';
import {RemoteStorageService} from "@terminal-core-lib/features/remote-storage/remote-storage.service";
import {TerminalSettings} from "@terminal-core-lib/features/terminal-settings/terminal-settings.types";
import {
  BehaviorSubject,
  debounceTime,
  filter,
  map,
  Observable,
  of,
  share,
  Subject,
  switchMap,
  take
} from 'rxjs';
import {GetRecordStatus} from '@terminal-core-lib/features/remote-storage/remote-storage-service.types';
import {TERMINAL_SETTINGS_DESKTOP_MIGRATION_MANAGER} from '@terminal-core-lib/features/settings-sync/migrations/settings-migrations.providers';
import {MigrationManagerBase} from '@terminal-core-lib/features/settings-sync/migrations/migration-manager-base';

export interface ReadTerminalSettingsResult {
  settings: TerminalSettings | null;
}

@Injectable()
export class TerminalSettingsBrokerService {
  private readonly remoteStorageService = inject(RemoteStorageService);

  private readonly terminalSettingsDesktopMigrationManager = inject<MigrationManagerBase>(TERMINAL_SETTINGS_DESKTOP_MIGRATION_MANAGER);

  private readonly destroyRef = inject(DestroyRef);

  private readonly saveRequestDelay = 10;

  private readonly saveQuery$ = new Subject<TerminalSettings>();

  private saveStream$?: Observable<boolean>;

  private get settingsKey(): string {
    return 'terminal-settings';
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.saveQuery$.complete());
  }

  readSettings(): Observable<ReadTerminalSettingsResult | null> {
    return this.remoteStorageService.getRecord(this.settingsKey).pipe(
      take(1),
      switchMap(settings => {
        if (settings.status === GetRecordStatus.Error) {
          return of(null);
        }

        if (settings.status === GetRecordStatus.NotFound || settings.record == null) {
          return of({
            settings: null
          });
        }

        return this.terminalSettingsDesktopMigrationManager.applyMigrations<TerminalSettings>(
          settings.record.value,
          migrated => this.saveSettings(migrated)
        ).pipe(
          map(x => ({
              settings: x.updatedData
            })
          )
        );
      }),
      take(1)
    );
  }

  saveSettings(settings: TerminalSettings): Observable<boolean> {
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

  removeSettings(): Observable<boolean> {
    return this.remoteStorageService.removeRecord(this.settingsKey);
  }

  private setRemoteRecord(settings: TerminalSettings): Observable<boolean> {
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
