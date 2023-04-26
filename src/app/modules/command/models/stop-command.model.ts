
import { InstrumentKey } from "src/app/shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "src/app/shared/models/portfolio-key.model";
import { Side } from "../../../shared/models/enums/side.model";
import { TimeInForce } from "../../../shared/models/commands/command-params.model";
import {LessMore} from "../../../shared/models/enums/less-more.model";

export interface StopCommand {
  quantity: number, //2,
  price?: number, // 190.97,
  instrument: InstrumentKey,
  user?: PortfolioKey,
  triggerPrice: number,
  condition: LessMore,
  stopEndUnixTime?: Date | number,
  side?: Side,
  timeInForce?: TimeInForce,
  icebergFixed?: number,
  icebergVariance?: number,
}
