import { Instrument } from '../../../shared/models/instruments/instrument.model';

export interface CommandContextModel<T>  {
  commandParameters: T
  instrument: Instrument;
}
