import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';


export interface OrderSubmitWidgetSettings extends WidgetSettings, InstrumentKey {
  defaultOrderType?: 'limit' | 'market' | 'stop';
  enableLimitOrdersFastEditing?: boolean;
  limitOrderPriceMoveSteps: number[];
  showVolumePanel?: boolean;
  workingVolumes: number[];
  skipMarginOrderConfirmation?: boolean;
}
