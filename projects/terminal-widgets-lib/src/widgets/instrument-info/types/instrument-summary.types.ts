import {
  Instrument,
  InstrumentType
} from '@terminal-core-lib/common/types/instrument.types';

export interface InstrumentSummary extends Instrument {
  typeByCfi: InstrumentType;
  board: string;
}
