import { StopOrderCondition } from "src/app/shared/models/enums/stoporder-conditions";
import { InstrumentKey } from "src/app/shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "src/app/shared/models/portfolio-key.model";

export interface StopCommand {
  side: string,
  quantity: number, //2,
  price: number | null, // 190.97,
  instrument: InstrumentKey,
  user: PortfolioKey,
  triggerPrice: number,
  condition: StopOrderCondition,
  stopEndUnixTime?: Date | number
}
