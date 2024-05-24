import { Injectable } from '@angular/core';
import { CommandBase } from "./command-base";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { Position } from "../../../shared/models/positions/position.model";
import { CommonOrderCommands } from "../../../shared/utils/common-order-commands";

export interface ClosePositionByMarketCommandArgs {
  currentPosition: Position | null;
  targetInstrumentBoard: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ClosePositionByMarketCommand extends CommandBase<ClosePositionByMarketCommandArgs> {
  constructor(private readonly wsOrdersService: WsOrdersService) {
    super();
  }

  execute(args: ClosePositionByMarketCommandArgs): void {
    if (!args.currentPosition || !args.currentPosition.qtyTFutureBatch) {
      return;
    }

    CommonOrderCommands.closePositionByMarket(
      args.currentPosition,
      args.targetInstrumentBoard,
      this.wsOrdersService
    );
  }
}
