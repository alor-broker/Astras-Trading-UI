import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';

export interface OrderSubmitSettings extends WidgetSettings, InstrumentKey {
  defaultOrderType?: 'limit' | 'market' | 'stop';
  enableLimitOrdersFastEditing?: boolean;
  limitOrderPriceMoveSteps: number[];
  showVolumePanel?: boolean;
  workingVolumes: number[];
}
