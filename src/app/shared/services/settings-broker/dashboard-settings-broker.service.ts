import {Injectable} from '@angular/core';
import {LocalStorageService} from "../local-storage.service";
import {RemoteStorageService} from "./remote-storage.service";
import {
  BehaviorSubject,
  combineLatest,
  filter,
  forkJoin,
  Observable,
  of,
  share,
  Subject,
  switchMap,
  take,
  tap
} from "rxjs";
import {Dashboard} from "../../models/dashboard/dashboard.model";
import {SettingsMeta, SettingsRef, SettingsType} from "../../models/settings-broker.model";
import {debounceTime, map} from "rxjs/operators";
import {RemoteStorageItem} from "../../models/remote-storage.model";
import {ApplicationMetaService} from "../application-meta.service";

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsBrokerService {
  private readonly saveRequestDelay = 2000;
  private readonly dashboardsStorageKey = 'dashboards-collection';
  private readonly saveQuery$ = new Subject<{ meta: SettingsMeta, settings: Dashboard[] }>();
  private saveStream$?: Observable<boolean>;

  constructor(
    private readonly localStorageService: LocalStorageService,
    private readonly remoteStorageService: RemoteStorageService,
    private readonly applicationMetaService: ApplicationMetaService
  ) {
  }

  private get settingsType(): SettingsType {
    return SettingsType.DashboardSettings;
  }

  readSettings(): Observable<Dashboard[] | null> {
    return combineLatest([
      this.applicationMetaService.getMeta(),
      this.getLatestItem()
    ]).pipe(
      switchMap(([meta, lastItem]) => {
        if (meta.lastResetTimestamp) {
          if (!!lastItem?.lastItem && meta.lastResetTimestamp > lastItem.settingsRef.meta.timestamp) {
            return of(null);
          }
        }

        if (!!lastItem?.lastItem) {
          return of(lastItem.lastItem);
        }

        // move settings from local storage for backward compatibility
        const localData = this.localStorageService.getItem<Dashboard[]>(this.dashboardsStorageKey);
        if (!!localData) {
          return this.addRemoteRecord(
            this.getSettingsMeta(),
            localData
          ).pipe(
            tap(r => {
              if (r) {
                this.localStorageService.removeItem(this.dashboardsStorageKey);
              }
            }),
            map(() => localData)
          );
        }

        return of(null);
      }),
      take(1)
    );
  }

  saveSettings(settings: Dashboard[]): Observable<boolean> {
    if (!this.saveStream$) {
      this.saveStream$ = this.saveQuery$.pipe(
        tap(x => console.log('emitted: ', x)),
        debounceTime(this.saveRequestDelay),
        tap(x => console.log(x)),
        switchMap(query => this.addRemoteRecord(query.meta, query.settings)),
        tap(x => {
          if (x) {
            this.cleanObsoleteSettings();
          }
        }),
        share()
      );
    }

    const result$ = new BehaviorSubject<boolean | null>(null);

    this.saveStream$.pipe(
      take(1)
    ).subscribe(x => {
      result$.next(x);
      result$.complete();
    });

    this.saveQuery$.next({
      meta: this.getSettingsMeta(),
      settings
    });

    return result$.pipe(
      filter((x): x is boolean => x != null)
    );
  }

  private getSettingsMeta(): SettingsMeta {
    return {
      settingsType: this.settingsType,
      timestamp: this.getTimestamp()
    };
  }

  private addRemoteRecord(meta: SettingsMeta, settings: Dashboard[]): Observable<boolean> {
    return this.remoteStorageService.addRecord(JSON.stringify(meta), JSON.stringify(settings));
  }

  private getTimestamp(): number {
    return Date.now();
  }

  private getExistedItems(): Observable<SettingsRef[]> {
    return this.remoteStorageService.getExistedRecordsMeta().pipe(
      take(1),
      map(r => {
        if (!r) {
          return [];
        }

        return r.map(i => ({
          id: i.Id,
          meta: JSON.parse(i.Descriptions)
        } as SettingsRef))
          .filter(i => i.meta.settingsType === this.settingsType);
      })
    );
  }

  private getLatestItemRef(allItems: SettingsRef[]): SettingsRef | null {
    return allItems
      .sort((a, b) => b.meta.timestamp - a.meta.timestamp)[0] ?? null;
  }

  private getLatestItem(): Observable<{ settingsRef: SettingsRef, lastItem: Dashboard[] | null } | null> {
    return this.getExistedItems().pipe(
      switchMap(items => {
        const latestItemRef = this.getLatestItemRef(items);

        if (!!latestItemRef) {
          return this.remoteStorageService.readSettings(latestItemRef.id).pipe(
            map(x => ({
              settingsRef: latestItemRef,
              lastItem: this.toDashboardSettings(x)
            }))
          );
        }

        return of(null);
      }),
      take(1)
    );
  }

  private toDashboardSettings(remoteStorageItem: RemoteStorageItem | null): Dashboard[] | null {
    if (!remoteStorageItem || !remoteStorageItem.UserSettings) {
      return null;
    }

    return JSON.parse(remoteStorageItem.UserSettings.Content) as Dashboard[];
  }

  private cleanObsoleteSettings() {
    this.getExistedItems().pipe(
      take(1),
      filter(items => items.length > 1),
      switchMap(items => {
        const latestItem = this.getLatestItemRef(items)!;
        const itemsToRemove = items.filter(i => i.meta.timestamp < latestItem.meta.timestamp);

        return forkJoin(itemsToRemove.map(i => this.remoteStorageService.removeRecord(i.id)));
      })
    ).subscribe();
  }
}
