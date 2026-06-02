import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';

export enum ColumnsOrder {
  VolumesAtTheEdges = 'volumesAtTheEdges',
  VolumesAtTheMiddle = 'volumesAtTheMiddle'
}

export interface OrderbookWidgetSettings extends WidgetSettings, InstrumentKey {
  depth?: number;
  showChart: boolean;
  showTable: boolean;
  showYieldForBonds: boolean;
  useOrderWidget?: boolean;
  showVolume?: boolean;
  columnsOrder?: ColumnsOrder;

  volumeDisplayFormat?: NumberDisplayFormat;
  showPriceWithZeroPadding?: boolean;
}
