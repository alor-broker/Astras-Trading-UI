import {
  ClusterTimeframe,
  TradesClusterHighlightMode,
  TradesClusterPanelSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';


export const TradesClusterPanelSettingsDefaults: TradesClusterPanelSettings = {
  timeframe: ClusterTimeframe.M1,
  displayIntervalsCount: 5,
  volumeDisplayFormat: NumberDisplayFormat.LetterSuffix,
  highlightMode: TradesClusterHighlightMode.Off
};
