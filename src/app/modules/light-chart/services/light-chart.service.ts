import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { HistoryService } from 'src/app/shared/services/history.service';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { LightChartSettings } from '../../../shared/models/settings/light-chart-settings.model';
import { BarsRequest } from '../models/bars-request.model';
import { Candle } from '../../../shared/models/history/candle.model';
import { HistoryRequest } from 'src/app/shared/models/history/history-request.model';
import { HistoryResponse } from 'src/app/shared/models/history/history-response.model';
import { BaseWebsocketService } from 'src/app/shared/services/base-websocket.service';
import { TimeframesHelper } from '../utils/timeframes-helper';
import { InstrumentsService } from '../../instruments/services/instruments.service';
import { mapWith } from "../../../shared/utils/observable-helper";
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";

export type LightChartSettingsExtended = LightChartSettings & { minstep?: number };

@Injectable()
export class LightChartService extends BaseWebsocketService {

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
    private readonly settingsService: WidgetSettingsService,
    private readonly history: HistoryService,
    private readonly instrumentsService: InstrumentsService) {
    super(ws);
  }

  getHistory(request: HistoryRequest): Observable<HistoryResponse> {
    return this.history.getHistory(request).pipe(
      filter((x): x is HistoryResponse => !!x)
    );
  }

  changeTimeframe(guid: string, timeFrame: string) {
    this.settingsService.updateSettings(guid, {timeFrame});
  }

  getBars(settings: LightChartSettings) {
    this.barsSettings.next(settings);
    return this.bars$;
  }

  getExtendedSettings(guid: string): Observable<LightChartSettingsExtended> {
    return this.settingsService.getSettings<LightChartSettings>(guid).pipe(
      map(x => x as LightChartSettingsExtended),
      switchMap(settings => {
        return this.instrumentsService.getInstrument({
          symbol: settings.symbol,
          exchange: settings.exchange,
          instrumentGroup: settings.instrumentGroup
        }).pipe(
          filter(x => !!x),
          map(x => ({
            ...settings,
            ...x
          } as LightChartSettingsExtended))
        );
      })
    );
  }

  private getLastHistoryPoint(settings: LightChartSettings): Observable<number> {
    const startPoint = Math.floor(new Date().getTime() / 1000);

    return this.history.getHistory(TimeframesHelper.getRequest(
      startPoint,
      settings,
      1)
    ).pipe(
      filter((x): x is HistoryResponse => !!x),
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
