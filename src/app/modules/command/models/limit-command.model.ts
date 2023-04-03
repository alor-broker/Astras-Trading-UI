import { InstrumentKey } from "src/app/shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "src/app/shared/models/portfolio-key.model";
import { TimeInForce } from "../../../shared/models/commands/command-params.model";

export interface LimitCommand {
  quantity: number, //2,
  price: number, // 190.97,
  instrument: InstrumentKey,
  user?: PortfolioKey,
  icebergFixed?: number,
  icebergVariance?: number,
  timeInForce?: TimeInForce,
}
