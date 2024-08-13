import { Injectable } from '@angular/core';
import { LightChartDatafeed } from './light-chart-datafeed';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { HistoryService } from '../../../shared/services/history.service';
import { TimeframeValue } from '../models/light-chart.models';
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';

@Injectable({
  providedIn: 'root'
})
export class LightChartDatafeedFactoryService {
  constructor(
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly historyService: HistoryService
  ) {
  }

  getDatafeed(instrumentKey: InstrumentKey, timeFrame: TimeframeValue): LightChartDatafeed {
    return new LightChartDatafeed(
      instrumentKey,
      timeFrame,
      this.subscriptionsDataFeedService,
      this.historyService
    );
  }
}
