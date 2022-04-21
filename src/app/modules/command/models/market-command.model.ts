import { InstrumentKey } from "src/app/shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "src/app/shared/models/portfolio-key.model";

export interface MarketCommand {
  side: string,
  quantity: number, //2,
  instrument: InstrumentKey,
  user: PortfolioKey
}
