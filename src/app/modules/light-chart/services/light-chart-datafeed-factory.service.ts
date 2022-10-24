import { Injectable } from '@angular/core';
import { LightChartDatafeed } from './light-chart-datafeed';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { WebsocketService } from '../../../shared/services/websocket.service';
import { HistoryService } from '../../../shared/services/history.service';
import { TimeframeValue } from '../models/light-chart.models';

@Injectable({
  providedIn: 'root'
})
export class LightChartDatafeedFactoryService {

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly historyService: HistoryService
  ) {
  }

  getDatafeed(instrumentKey: InstrumentKey, timeFrame: TimeframeValue): LightChartDatafeed {
    return new LightChartDatafeed(
      instrumentKey,
      timeFrame,
      this.websocketService,
      this.historyService
    );
  }
}
