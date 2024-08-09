import { Injectable } from '@angular/core';
import { Position } from "../../../shared/models/positions/position.model";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { CommandBase } from "./command-base";
import { CommonOrderCommands } from "../../../shared/utils/common-order-commands";

export interface ReversePositionByMarketCommandArgs {
  currentPosition: Position | null;
  targetInstrumentBoard: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ReversePositionByMarketCommand extends CommandBase<ReversePositionByMarketCommandArgs> {
  constructor(private readonly wsOrdersService: WsOrdersService) {
    super();
  }

  execute(args: ReversePositionByMarketCommandArgs): void {
    if (!args.currentPosition || !args.currentPosition.qtyTFutureBatch) {
      return;
    }

    CommonOrderCommands.reversePositionsByMarket(
      args.currentPosition,
      args.targetInstrumentBoard,
      this.wsOrdersService
    );
  }
}
