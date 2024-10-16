import { Injectable } from '@angular/core';
import { Position } from "../../../shared/models/positions/position.model";
import { CommandBase } from "./command-base";
import { CommonOrderCommands } from "../../../shared/utils/common-order-commands";
import { OrderCommandService } from "../../../shared/services/orders/order-command.service";

export interface ReversePositionByMarketCommandArgs {
  currentPosition: Position | null;
  targetInstrumentBoard: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ReversePositionByMarketCommand extends CommandBase<ReversePositionByMarketCommandArgs> {
  constructor(private readonly orderCommandService: OrderCommandService) {
    super();
  }

  execute(args: ReversePositionByMarketCommandArgs): void {
    if (!args.currentPosition || !args.currentPosition.qtyTFutureBatch) {
      return;
    }

    CommonOrderCommands.reversePositionsByMarket(
      args.currentPosition,
      args.targetInstrumentBoard,
      this.orderCommandService
    );
  }
}
