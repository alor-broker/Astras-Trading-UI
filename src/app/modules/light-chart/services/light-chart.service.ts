import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subscription, tap } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { HistoryService } from 'src/app/shared/services/history.service';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { LightChartSettings } from '../../../shared/models/settings/light-chart-settings.model';
import { BarsRequest } from '../models/bars-request.model';
import { Candle } from '../../../shared/models/history/candle.model';
import { HistoryRequest } from 'src/app/shared/models/history/history-request.model';
import { HistoryResponse } from 'src/app/shared/models/history/history-response.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { BaseWebsocketService } from 'src/app/shared/services/base-websocket.service';
import { Store } from '@ngrx/store';
import { getSelectedInstrument } from '../../../store/instruments/instruments.selectors';
import { TimeframesHelper } from '../utils/timeframes-helper';
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../instruments/services/instruments.service';
import { mapWith } from "../../../shared/utils/observable-helper";

type LightChartSettingsExtended = LightChartSettings & { minstep?: number };

@Injectable()
export class LightChartService extends BaseWebsocketService<LightChartSettings> {
  private settingsSub?: Subscription;

  private readonly barsSettings = new BehaviorSubject<LightChartSettings | null>(null);
  // bars have to be piped with getLastHistoryPoint method
  // otherwise, a situation is possible when the request for the last point does not keep up with the change in settings
  // as a result the data subscription turns out to be incorrect
  private readonly bars$ = this.barsSettings.pipe(
    filter((x): x is LightChartSettings => !!x),
    mapWith(settings => this.getLastHistoryPoint(settings), (s, hp) => ({ settings: s, lastPoint: hp })),
    switchMap((x) => {
      return this.getBarsReq(
        x.settings.symbol,
        x.settings.exchange,
        x.settings.timeFrame,
        x.lastPoint,
        x.settings.instrumentGroup
      );
    })
  );

  constructor(
    ws: WebsocketService,
    settingsService: DashboardService,
    private readonly history: HistoryService,
    private readonly instrumentsService: InstrumentsService,
    private store: Store) {
    super(ws, settingsService);
  }

  getHistory(request: HistoryRequest): Observable<HistoryResponse> {
    return this.history.getHistory(request);
  }

  changeTimeframe(timeframe: string) {
    const current = this.getSettingsValue();
    if (current) {
      this.setSettings({ ...current, timeFrame: timeframe });
    }
  }

  initSettingsUpdates(guid: string) {
    this.settingsSub?.unsubscribe();
    this.settingsSub = combineLatest([this.store.select(getSelectedInstrument), this.getSettings(guid)]).pipe(
      tap(([i, current]) => {
        if (current && current.linkToActive && !this.isSettingsMatchInstrument(current, i)) {
          this.setSettings({ ...current, ...i });
        }
      })
    ).subscribe();
  }

  getBars(settings: LightChartSettings) {
    this.barsSettings.next(settings);
    return this.bars$;
  }

  getSettings(guid: string): Observable<LightChartSettingsExtended> {
    return combineLatest([
      super.getSettings(guid),
      this.store.select(getSelectedInstrument)
    ]).pipe(
      filter(([settings, instrument]) => !!settings && !!instrument),
      map(([settings, instrument]) => {
        if (settings.linkToActive && this.isSettingsMatchInstrument(settings, instrument)) {
          return {
            ...settings,
            ...instrument
          };
        }

        return settings as LightChartSettingsExtended;
      }),
      switchMap(settings => {
        if (settings.minstep == null) {
          return this.instrumentsService.getInstrument({
            symbol: settings.symbol,
            exchange: settings.exchange,
            instrumentGroup: settings.instrumentGroup
          }).pipe(
            filter(x => !!x),
            map(x => ({
              ...settings,
              ...x
            }))
          );
        }

        return of(settings);
      })
    );
  }

  private isSettingsMatchInstrument(settings: LightChartSettings, instrument: Instrument) {
    if (!settings || !instrument) {
      return false;
    }

    return settings.symbol == instrument.symbol &&
      settings.exchange == instrument.exchange &&
      settings.instrumentGroup == instrument.instrumentGroup;
  }

  private getLastHistoryPoint(settings: LightChartSettings): Observable<number> {
    const startPoint = Math.floor(new Date().getTime() / 1000);

    return this.history.getHistory(TimeframesHelper.getRequest(
      startPoint,
      settings,
      1)
    ).pipe(
      map(history => {
        const prevTime = history.history.length > 0
          ? Math.max(...history.history.map(x => x.time))
          : history.prev;

        return prevTime ?? startPoint;
      })
    );
  }

  private getBarsReq(symbol: string, exchange: string, tf: string, historyFrom: number, instrumentGroup?: string) {
    const request: BarsRequest = {
      opcode: 'BarsGetAndSubscribe',
      code: symbol,
      exchange: exchange,
      format: 'simple',
      guid: GuidGenerator.newGuid(),
      instrumentGroup,
      tf: tf, //60,
      from: TimeframesHelper.getFromTimeForTimeframe(tf, new Date(historyFrom * 1000))
    };

    return this.getEntity<Candle>(request);
  }
}
