import { WidgetSettings } from "../widget-settings.model";
import { InstrumentKey } from "../instruments/instrument-key.model";

export interface VolumeHighlightOption {
  boundary: number;
  color: string;
}

export interface VerticalOrderBookSettings extends WidgetSettings, InstrumentKey {
  depth?: number;
  showYieldForBonds: boolean;
  showZeroVolumeItems: boolean;
  showSpreadItems: boolean;
  highlightHighVolume: boolean;
  volumeHighlightOptions: VolumeHighlightOption[];
  workingVolumes: number[];
}
