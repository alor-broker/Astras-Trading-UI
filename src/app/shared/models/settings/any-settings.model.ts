import { BlotterSettings } from "./blotter-settings.model";
import { InfoSettings } from "./info-settings.model";
import { InstrumentSelectSettings } from "./instrument-select-settings.model";
import { LightChartSettings } from "./light-chart-settings.model";
import { OrderbookSettings } from "./orderbook-settings.model";
import { AllTradesSettings } from "./all-trades-settings.model";
import { NewsSettings } from "./news-settings.model";
import { ExchangeRateSettings } from "./exchange-rate-settings.model";
import { ScalperOrderBookSettings } from "./scalper-order-book-settings.model";

export type AnySettings = (
  LightChartSettings |
  OrderbookSettings |
  ScalperOrderBookSettings |
  InstrumentSelectSettings |
  BlotterSettings |
  InfoSettings |
  AllTradesSettings |
  NewsSettings |
  ExchangeRateSettings
  );
