import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';

export interface NewsFilters {
  includedKeyWords: string[];
  excludedKeyWords: string[];
  symbols: string[];
}

export interface NewsWidgetSettings extends WidgetSettings, InstrumentKey {
  refreshIntervalSec?: number;
  allNewsFilters?: NewsFilters | null;
}
