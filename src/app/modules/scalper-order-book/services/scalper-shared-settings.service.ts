import {
  Injectable,
  NgZone,
} from '@angular/core';
import { RemoteStorageService } from "../../../shared/services/settings-broker/remote-storage.service";
import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  subscribeOn,
  switchMap,
  take
} from "rxjs";
import { InstrumentLinkedSettings } from "../models/scalper-order-book-settings.model";
import { ApplicationMetaService } from "../../../shared/services/application-meta.service";
import {
  filter,
  map
} from "rxjs/operators";
import { StorageRecord } from "../../../shared/models/settings-broker.model";
import { GuidGenerator } from "../../../shared/utils/guid";

export interface InstrumentId {
  symbol: string;
  exchange: string;
  board: string;
}

interface InstrumentLinkedSettingsRecord extends Partial<InstrumentLinkedSettings> {
  instrumentKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScalperSharedSettingsService {
  private readonly currentSettings$ = new BehaviorSubject<Map<string, Partial<InstrumentLinkedSettings>> | null>(null);
  private initialSettings: Observable<StorageRecord[] | null> | null = null;

  constructor(
    private readonly remoteStorageService: RemoteStorageService,
    private readonly applicationMetaService: ApplicationMetaService,
    private readonly ngZone: NgZone
  ) {
  }

  private get groupKey(): string {
    // scalper orderbook instrument linked settings
    // unable to set descriptive group name because of length restrictions in API
    return 'scob-ils';
  }

  getSettingsForInstrument(instrumentId: InstrumentId): Observable<Partial<InstrumentLinkedSettings> | null> {
    return this.getInitialSettings().pipe(
      switchMap(() => this.currentSettings$),
      filter(x => x != null),
      map(curr => curr.get(this.getInstrumentRecordKey(instrumentId)) ?? null),
      distinctUntilChanged((previous, current) => previous === current),
    );
  }

  updateSettingsForInstrument(
    instrumentId: InstrumentId,
    updates: Partial<InstrumentLinkedSettings>
  ): void {
    this.getInitialSettings().pipe(
      switchMap(() => this.currentSettings$),
      take(1),
      filter(x => x != null),
      subscribeOn(asyncScheduler)
    ).subscribe(currentSettings => {
      const recordKey = this.getInstrumentRecordKey(instrumentId);
      const currentInstrumentSettings = currentSettings.get(recordKey) ?? null;

      const updatedSettings = {
        ...currentInstrumentSettings,
        ...updates
      };

      currentSettings.set(recordKey, updatedSettings);
      this.saveUpdates(instrumentId, updatedSettings);

      this.currentSettings$.next(currentSettings);
    });
  }

  private getInitialSettings(): Observable<StorageRecord[] | null> {
    if (this.initialSettings == null) {
      this.initialSettings = combineLatest({
        meta: this.applicationMetaService.getMeta(),
        settings: this.remoteStorageService.getGroup(this.groupKey)
      }).pipe(
        switchMap(x => {
          if (x.settings == null) {
            return of(null);
          }

          if (x.meta.lastResetTimestamp != null) {
            if (x.settings.some(s => x.meta.lastResetTimestamp! > s.meta.timestamp)) {
              // clean settings after reset
              return this.remoteStorageService.removeGroup(this.groupKey).pipe(
                map(() => [])
              );
            }
          }
          return of(x.settings);
        }),
        take(1),
        shareReplay(1)
      );

      this.initialSettings.pipe(
        take(1),
      ).subscribe(savedValues => {
        if (savedValues != null) {
          this.currentSettings$.next(new Map<string, Partial<InstrumentLinkedSettings>>(
            savedValues.map(i => {
              const item = i.value as InstrumentLinkedSettingsRecord;
              return [item.instrumentKey, item];
            })
          ));
        }
      });
    }

    return this.initialSettings;
  }

  private getInstrumentRecordKey(instrumentId: InstrumentId): string {
    return `${instrumentId.symbol}-${instrumentId.exchange}-${instrumentId.board}`;
  }

  private saveUpdates(instrumentId: InstrumentId, updates: Partial<InstrumentLinkedSettings>): void {
    this.ngZone.runOutsideAngular(() => {
      this.remoteStorageService.setRecord(
        {
          key: GuidGenerator.newGuid(),
          meta: {
            timestamp: Date.now()
          },
          value: {
            ...updates,
            instrumentKey: this.getInstrumentRecordKey(instrumentId),
          } as InstrumentLinkedSettingsRecord,
        },
        this.groupKey
      ).subscribe();
    });
  }
}
