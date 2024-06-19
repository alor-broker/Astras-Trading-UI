import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { NumberDisplayFormat } from '../../../shared/models/enums/number-display-format';

export enum ColumnsOrder {
  VolumesAtTheEdges = 'volumesAtTheEdges',
  VolumesAtTheMiddle = 'volumesAtTheMiddle'
}

export interface OrderbookSettings extends WidgetSettings, InstrumentKey {
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
