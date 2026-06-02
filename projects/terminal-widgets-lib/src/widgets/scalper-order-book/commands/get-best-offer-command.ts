import {
  inject,
  Injectable
} from '@angular/core';
import {
  LimitOrderTracker,
  SubmitLimitOrderCommand
} from "./submit-limit-order-command";
import {CommandBase} from "./command-base";
import {BracketOptions} from "./bracket-command";
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {OrderbookData} from '@terminal-core-lib/features/instruments/services/orderbook-service.types';

export interface GetBestOfferCommandArgs {
  instrumentKey: InstrumentKey;
  side: Side;
  quantity: number;
  targetPortfolio: string;
  orderBook: OrderbookData;
  bracketOptions: BracketOptions | null;
  priceStep: number;
  orderTracker?: LimitOrderTracker;
  allowMargin?: boolean;
}

@Injectable()
export class GetBestOfferCommand extends CommandBase<GetBestOfferCommandArgs> {
  private readonly submitLimitOrderCommand = inject(SubmitLimitOrderCommand);

  execute(args: GetBestOfferCommandArgs): void {
    const orderBook = args.orderBook;

    let bestPrice: number;
    if (args.side === Side.Buy) {
      if (orderBook.a.length === 0) {
        return;
      }

      bestPrice = orderBook.a[0].p;
    } else {
      if (orderBook.b.length === 0) {
        return;
      }

      bestPrice = orderBook.b[0].p;
    }

    this.submitLimitOrderCommand.execute({
      instrumentKey: args.instrumentKey,
      quantity: args.quantity,
      price: bestPrice,
      side: args.side,
      targetPortfolio: args.targetPortfolio,
      bracketOptions: args.bracketOptions,
      priceStep: args.priceStep,
      silent: true,
      orderTracker: args.orderTracker,
      allowMargin: args.allowMargin,
    });
  }
}
