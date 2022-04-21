import { InstrumentKey } from "src/app/shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "src/app/shared/models/portfolio-key.model";

export interface LimitCommand {
  side: string,
  quantity: number, //2,
  price: number, // 190.97,
  instrument: InstrumentKey,
  user: PortfolioKey
}
