import { Injectable, inject } from '@angular/core';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { TimeframeValue } from "../../light-chart/models/light-chart.models";
import { Observable } from "rxjs";
import { Candle } from "../../../shared/models/history/candle.model";
import { BarsRequest } from "../../light-chart/models/bars-request.model";
import { SubscriptionsDataFeedService } from "../../../shared/services/subscriptions-data-feed.service";

@Injectable({
  providedIn: 'root'
})
export class CandlesService {
  private readonly subscriptionDatafeedService = inject(SubscriptionsDataFeedService);

  getInstrumentLastCandle(instrument: InstrumentKey, timeFrame: TimeframeValue): Observable<Candle> {
    const request: BarsRequest = {
      opcode: 'BarsGetAndSubscribe',
      code: instrument.symbol,
      exchange: instrument.exchange,
      instrumentGroup: instrument.instrumentGroup,
      format: 'simple',
      tf: timeFrame,
      from: (new Date()).getTime() / 1000
    };

    return this.subscriptionDatafeedService.subscribe<BarsRequest, Candle>(
      request,
      () => `getInstrumentLastCandle_${instrument.exchange}_${instrument.symbol}_${instrument.instrumentGroup}`
    );
  }
}
