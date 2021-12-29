import { CommandParams } from "src/app/shared/models/commands/command-params.model";
import { Quote } from "src/app/shared/models/quotes/quote.model";

export interface CommandViewData {
  command?: CommandParams,
  quote?: Quote,
}
