import { Injectable, inject } from '@angular/core';
import { CommandBase } from "./command-base";
import { Position } from "../../../shared/models/positions/position.model";
import { CommonOrderCommands } from "../../../shared/utils/common-order-commands";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../shared/services/orders/order-command.service";

export interface ClosePositionByMarketCommandArgs {
  currentPosition: Position | null;
  targetInstrumentBoard: string | null;
}

@Injectable()
export class ClosePositionByMarketCommand extends CommandBase<ClosePositionByMarketCommandArgs> {
  private readonly orderCommandService = inject<OrderCommandService>(ORDER_COMMAND_SERVICE_TOKEN);

  execute(args: ClosePositionByMarketCommandArgs): void {
    if (!args.currentPosition || !args.currentPosition.qtyTFutureBatch) {
      return;
    }

    CommonOrderCommands.closePositionByMarket(
      args.currentPosition,
      args.targetInstrumentBoard,
      this.orderCommandService
    );
  }
}
