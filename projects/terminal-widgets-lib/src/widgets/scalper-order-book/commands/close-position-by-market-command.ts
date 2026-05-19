import {
  inject,
  Injectable
} from '@angular/core';
import {CommandBase} from "./command-base";
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {CommonOrderCommands} from '@terminal-core-lib/features/orders/utils/common-order-commands';

export interface ClosePositionByMarketCommandArgs {
  currentPosition: Position | null;
  targetInstrumentBoard: string | null;
}

@Injectable()
export class ClosePositionByMarketCommand extends CommandBase<ClosePositionByMarketCommandArgs> {
  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

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
