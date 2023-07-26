import {Injectable} from '@angular/core';
import {LocalStorageService} from "../local-storage.service";
import {RemoteStorageService} from "./remote-storage.service";
import {BehaviorSubject, combineLatest, Observable, of, share, Subject, switchMap, take, tap} from "rxjs";
import {Dashboard} from "../../models/dashboard/dashboard.model";
import {debounceTime, filter, map} from "rxjs/operators";
import {ApplicationMetaService} from "../application-meta.service";

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsBrokerService {
  private readonly saveRequestDelay = 1000;
  private readonly dashboardsStorageKey = 'dashboards-collection';
  private readonly saveQuery$ = new Subject<Dashboard[]>();
  private saveStream$?: Observable<boolean>;

  constructor(
    private readonly localStorageService: LocalStorageService,
    private readonly remoteStorageService: RemoteStorageService,
    private readonly applicationMetaService: ApplicationMetaService
  ) {
  }

  private get settingsKey(): string {
    return this.dashboardsStorageKey;
  }

  readSettings(): Observable<Dashboard[] | null> {
    const settings$ = this.remoteStorageService.getRecord<Dashboard[]>(this.settingsKey).pipe(
      take(1)
    );

    return combineLatest([
      this.applicationMetaService.getMeta(),
      settings$
    ]).pipe(
      switchMap(([meta, settings]) => {
        if (meta.lastResetTimestamp != null) {
          if (!!settings && meta.lastResetTimestamp > settings.meta.timestamp) {
            return of(null);
          }
        }

        if (!!settings) {
          return of(settings.value);
        }

        // move settings from local storage for backward compatibility
        const localData = this.localStorageService.getItem<Dashboard[]>(this.dashboardsStorageKey);
        if (!!localData) {
          return this.setRemoteRecord(localData).pipe(
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
        debounceTime(this.saveRequestDelay),
        switchMap(query => this.setRemoteRecord(query)),
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

    this.saveQuery$.next(settings);

    return result$.pipe(
      filter((x): x is boolean => x != null)
    );
  }

  private setRemoteRecord(settings: Dashboard[]): Observable<boolean> {
    return this.remoteStorageService.setRecord(
      this.settingsKey, {
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
