import { BlotterSettings } from "./blotter-settings.model";
import { InfoSettings } from "./info-settings.model";
import { InstrumentSelectSettings } from "./instrument-select-settings.model";
import { LightChartSettings } from "./light-chart-settings.model";
import { OrderbookSettings } from "./orderbook-settings.model";
import { AllTradesSettings } from "./all-trades-settings.model";
import { NewsSettings } from "./news-settings.model";
import { ExchangeRateSettings } from "./exchange-rate-settings.model";
import { ScalperOrderBookSettings } from "./scalper-order-book-settings.model";
import { OrderSubmitSettings } from './order-submit-settings.model';
import { OrdersBasketSettings } from './orders-basket-settings.model';
import { TechChartSettings } from './tech-chart-settings.model';
import { AllInstrumentsSettings } from './all-instruments-settings.model';

export type AnySettings = (
  InstrumentSelectSettings |
  OrderbookSettings |
  ScalperOrderBookSettings |
  LightChartSettings |
  TechChartSettings |
  BlotterSettings |
  InfoSettings |
  NewsSettings |
  AllTradesSettings |
  ExchangeRateSettings |
  AllInstrumentsSettings |
  OrderSubmitSettings |
  OrdersBasketSettings
  );
