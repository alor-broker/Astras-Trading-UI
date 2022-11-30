import { WidgetSettings } from "../widget-settings.model";
import { InstrumentKey } from "../instruments/instrument-key.model";

export interface OrderSubmitSettings extends WidgetSettings, InstrumentKey {
  enableLimitOrdersFastEditing?: boolean;
  limitOrderPriceMoveSteps: number[];
  showVolumePanel?: boolean;
  workingVolumes: number[];
}
