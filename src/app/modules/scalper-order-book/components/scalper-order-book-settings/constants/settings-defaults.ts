import {
  ClusterTimeframe,
  TradesClusterHighlightMode,
  TradesClusterPanelSettings
} from "../../../models/scalper-order-book-settings.model";
import { NumberDisplayFormat } from "../../../../../shared/models/enums/number-display-format";

export const TradesClusterPanelSettingsDefaults: TradesClusterPanelSettings = {
  timeframe: ClusterTimeframe.M1,
  displayIntervalsCount: 5,
  volumeDisplayFormat: NumberDisplayFormat.LetterSuffix,
  highlightMode: TradesClusterHighlightMode.Off
};
