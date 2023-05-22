import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";

export interface ArbitrageSpread {
  id?: string;
  firstLeg: SpreadLeg;
  secondLeg: SpreadLeg;
  buySpread?: number;
  sellSpread?: number;
}

export interface SpreadLeg {
  instrument: Instrument;
  quantity: number;
  ratio: number;
  portfolio: PortfolioKey;
  positionsCount?: number;
}
