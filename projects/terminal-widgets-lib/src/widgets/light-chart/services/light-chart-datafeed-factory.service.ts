import {
  inject,
  Injectable
} from '@angular/core';
import {LightChartDatafeed} from './light-chart-datafeed';
import {CandlesService} from '@terminal-core-lib/features/instruments/services/candles.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';

@Injectable()
export class LightChartDatafeedFactoryService {
  private readonly candlesService = inject(CandlesService);

  getDatafeed(instrumentKey: InstrumentKey, timeFrame: TimeframeValue): LightChartDatafeed {
    return new LightChartDatafeed(
      instrumentKey,
      timeFrame,
      this.candlesService
    );
  }
}
