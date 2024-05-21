import { Injectable } from '@angular/core';
import { RemoteStorageService } from "./remote-storage.service";
import { ApplicationMetaService } from "../application-meta.service";
import {
  BehaviorSubject,
  combineLatest,
  forkJoin,
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import { WidgetSettings } from "../../models/widget-settings.model";
import {
  debounceTime,
  finalize,
  map
} from "rxjs/operators";
import { WidgetSettingsDesktopMigrationManager } from "../../../modules/settings-migration/widget-settings/widget-settings-desktop-migration-manager";

@Injectable({
  providedIn: 'root'
})
export class WidgetsSettingsBrokerService {
  private readonly saveRequestDelay = 100;
  private readonly saveRequests = new Map<string, {
    source: BehaviorSubject<WidgetSettings>;
    stream$: Observable<boolean>;
  }>();

  constructor(
    private readonly remoteStorageService: RemoteStorageService,
    private readonly applicationMetaService: ApplicationMetaService,
    private readonly widgetSettingsDesktopMigrationManager: WidgetSettingsDesktopMigrationManager
  ) {
  }

  private get groupKey(): string {
    return 'widget-settings';
  }

  readSettings(): Observable<WidgetSettings[] | null> {
    const settings$ = this.remoteStorageService.getGroup(this.groupKey).pipe(
      take(1)
    );

    return combineLatest([
      this.applicationMetaService.getMeta(),
      settings$
    ]).pipe(
      switchMap(([meta, settings]) => {
        if (meta.lastResetTimestamp != null) {
          if (!!settings && settings.some(s => meta.lastResetTimestamp! > s.meta.timestamp)) {
            // clean settings after reset
            return this.remoteStorageService.removeGroup(this.groupKey).pipe(
              map(() => null)
            );
          }
        }

        if (!!settings && settings.length > 0) {
          return this.widgetSettingsDesktopMigrationManager.applyMigrations<WidgetSettings[]>(
            settings.map(x => x.value as WidgetSettings[]),
            migrated => this.saveSettings(migrated)
          ).pipe(
            map(x => x.updatedData)
          );
        }

        return of(null);
      }),
      take(1)
    );
  }

  removeSettings(guids: string[]): Observable<boolean> {
    return this.removeRemoteRecords(guids);
  }

  saveSettings(settings: WidgetSettings[]): Observable<boolean> {
    return this.setRemoteRecords(settings);
  }

  private setRemoteRecords(settings: WidgetSettings[]): Observable<boolean> {
    if (settings.length === 0) {
      return of(true);
    }

    return forkJoin(
      settings.map(s => this.getSaveRequest(s))
    ).pipe(
      map(r => r.every(i => !!i)),
      take(1)
    );
  }

  private getSaveRequest(settings: WidgetSettings): Observable<boolean> {
    const existedRequest = this.saveRequests.get(settings.guid);
    if (existedRequest) {
      existedRequest.source.next(settings);
      return existedRequest.stream$;
    }

    const newRequestSource = new BehaviorSubject<WidgetSettings>(settings);
    const newRequest = {
      source: newRequestSource,
      stream$: newRequestSource.pipe(
        debounceTime(this.saveRequestDelay),
        switchMap(newSettings => this.remoteStorageService.setRecord(
          {
            key: newSettings.guid,
            meta: {
              timestamp: this.getTimestamp()
            },
            value: newSettings
          },
          this.groupKey)),
        take(1),
        finalize(() => this.saveRequests.delete(settings.guid)),
        shareReplay(1)
      )
    };

    this.saveRequests.set(settings.guid, newRequest);

    return newRequest.stream$;
  }

  private removeRemoteRecords(keys: string[]): Observable<boolean> {
    if (keys.length === 0) {
      return of(true);
    }

    return forkJoin(
      keys.map(k => this.remoteStorageService.removeRecord(k))
    ).pipe(
      map(r => r.every(i => !!i)),
      take(1)
    );
  }

  private getTimestamp(): number {
    return Date.now();
  }
}
