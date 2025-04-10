import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { Side } from "../../../shared/models/enums/side.model";

export interface ArbitrageSpread {
  id?: string;
  calculationFormula?: string;
  firstLeg: SpreadLeg;
  secondLeg: SpreadLeg;
  isThirdLeg: boolean;
  thirdLeg: SpreadLeg;
  buySpread: number | null;
  sellSpread: number | null;
}

export interface SpreadLeg {
  instrument: Instrument;
  quantity: number;
  ratio: number;
  portfolio: PortfolioKey;
  side?: Side;
  positionsCount?: number;
}
