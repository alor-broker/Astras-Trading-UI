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
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {OrderbookData} from '@terminal-core-lib/features/instruments/services/orderbook-service.types';

export interface SubmitBestPriceOrderCommandArgs {
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
export class SubmitBestPriceOrderCommand extends CommandBase<SubmitBestPriceOrderCommandArgs> {
  private readonly submitLimitOrderCommand = inject(SubmitLimitOrderCommand);

  execute(args: SubmitBestPriceOrderCommandArgs): void {
    const orderBook = args.orderBook;
    if (orderBook.a.length === 0 || orderBook.b.length === 0) {
      return;
    }

    let price: number | null;

    const bestAsk = orderBook.a[0].p;
    const bestBid = orderBook.b[0].p;
    const priceStep = args.priceStep;

    const pricePrecision = Math.max(
      MathHelper.getPrecision(priceStep),
      MathHelper.getPrecision(bestAsk),
      MathHelper.getPrecision(bestBid)
    );

    const diff = MathHelper.round(bestAsk - bestBid, pricePrecision);

    if (diff > priceStep) {
      price = args.side === Side.Sell
        ? bestAsk - priceStep
        : bestBid + priceStep;

      price = MathHelper.round(price, pricePrecision);
    } else {
      price = args.side === Side.Sell
        ? bestAsk
        : bestBid;
    }

    if (price == null) {
      return;
    }

    this.submitLimitOrderCommand.execute({
      instrumentKey: args.instrumentKey,
      quantity: args.quantity,
      price,
      side: args.side,
      targetPortfolio: args.targetPortfolio,
      bracketOptions: args.bracketOptions,
      priceStep: args.priceStep,
      silent: true,
      orderTracker: args.orderTracker,
      allowMargin: args.allowMargin
    });
  }
}
