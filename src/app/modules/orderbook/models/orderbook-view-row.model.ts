import { CancelCommand } from "src/app/shared/models/commands/cancel-command.model";

export interface OrderBookViewRow {
  bidVolume?: number,
  bid?: number,
  ask?: number,
  askVolume?: number,
  askOrderVolume?: number,
  bidOrderVolume?: number,
  askCancels?: CancelCommand[],
  bidCancels?: CancelCommand[],
}
