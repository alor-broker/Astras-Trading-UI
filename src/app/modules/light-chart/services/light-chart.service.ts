import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
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

@Injectable({
  providedIn: 'root',
})
export class LightChartService extends BaseWebsocketService<LightChartSettings> {
  private bars$: Observable<Candle> = new Observable();
  private guid?: string;

  constructor(ws: WebsocketService,
    settingsService: DashboardService,
    private history: HistoryService,
    private store: Store) {
    super(ws, settingsService);
  }

  getHistory(request: HistoryRequest) : Observable<HistoryResponse> {
    return this.history.getHistory(request);
  }

  changeTimeframe(timeframe: string) {
    const current = this.getSettingsValue();
    if (current) {
      this.setSettings({ ...current, timeFrame: timeframe});
    }
  }

  getBars(guid: string) {
    combineLatest([this.store.select(getSelectedInstrument), this.getSettings(guid)]).pipe(
      map(([i, current]) => {
        if (current && current.linkToActive &&
            !(current.symbol == i.symbol &&
            current.exchange == i.exchange &&
            current.instrumentGroup == i.instrumentGroup)
        ) {
          this.setSettings({ ...current, ...i });
        }
      })
    ).subscribe();
    this.bars$ = this.getSettings(guid).pipe(
      filter((s): s is LightChartSettings  => !!s),
      switchMap(s =>{
        return this.getBarsReq(s.symbol, s.exchange, s.timeFrame, s.from, s.instrumentGroup);
      })
    );
    return this.bars$;
  }

  private getBarsReq(symbol: string, exchange: string, tf: string, from: number, instrumentGroup?: string) {
    const request: BarsRequest = {
      opcode: 'BarsGetAndSubscribe',
      code: symbol,
      exchange: exchange,
      format: 'simple',
      guid: GuidGenerator.newGuid(),
      instrumentGroup,
      tf: tf, //60,
      from: from, //1640172544
    };

    const bars$ = this.getEntity<Candle>(request);
    return bars$;
  }
}
