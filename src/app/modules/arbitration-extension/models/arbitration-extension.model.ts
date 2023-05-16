import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";

export interface ArbitrationExtension {
  id?: string;
  firstLeg: ExtensionLeg;
  secondLeg: ExtensionLeg;
  buyExtension?: number;
  sellExtension?: number;
}

export interface ExtensionLeg {
  instrument: Instrument;
  quantity: number;
  ratio: number;
  portfolio: PortfolioKey;
  positionsCount?: number;
}
