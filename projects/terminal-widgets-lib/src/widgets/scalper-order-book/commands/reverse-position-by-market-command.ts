import {
  inject,
  Injectable
} from '@angular/core';
import {CommandBase} from "./command-base";
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {CommonOrderCommands} from '@terminal-core-lib/features/orders/utils/common-order-commands';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';

export interface ReversePositionByMarketCommandArgs {
  currentPosition: Position | null;
  targetInstrumentBoard: string | null;
  allowMargin?: boolean;
}

@Injectable()
export class ReversePositionByMarketCommand extends CommandBase<ReversePositionByMarketCommandArgs> {
  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  execute(args: ReversePositionByMarketCommandArgs): void {
    if (!args.currentPosition || !args.currentPosition.qtyTFutureBatch) {
      return;
    }

    CommonOrderCommands.reversePositionsByMarket(
      args.currentPosition,
      args.targetInstrumentBoard,
      this.orderCommandService,
      args.allowMargin
    );
  }
}
