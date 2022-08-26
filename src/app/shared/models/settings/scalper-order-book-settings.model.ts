import { WidgetSettings } from "../widget-settings.model";
import { InstrumentKey } from "../instruments/instrument-key.model";

export enum VolumeHighlightMode {
  Off = 'off',
  BiggestVolume = 'biggestVolume',
  VolumeBoundsWithFixedValue = 'volumeBoundsWithFixedValue'
}

export interface VolumeHighlightOption {
  boundary: number;
  color: string;
}

export interface ScalperOrderBookSettings extends WidgetSettings, InstrumentKey {
  depth?: number;
  showZeroVolumeItems: boolean;
  showSpreadItems: boolean;
  volumeHighlightMode?: VolumeHighlightMode;
  volumeHighlightOptions: VolumeHighlightOption[];
  volumeHighlightFullness?: number;
  workingVolumes: number[];
  disableHotkeys: boolean;
  enableMouseClickSilentOrders: boolean;
}
