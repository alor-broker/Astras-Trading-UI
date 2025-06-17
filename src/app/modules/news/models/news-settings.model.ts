import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

export interface NewsFilters {
  includedKeyWords: string[];
  excludedKeyWords: string[];
  symbols: string[];
}

export interface NewsSettings extends WidgetSettings, InstrumentKey {
  refreshIntervalSec?: number;
  allNewsFilters?: NewsFilters | null;
}
