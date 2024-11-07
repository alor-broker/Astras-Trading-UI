import { Injectable } from '@angular/core';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Side } from "../../../shared/models/enums/side.model";
import {
  BracketOptions,
  LimitOrderTracker,
  SubmitLimitOrderCommand
} from "./submit-limit-order-command";
import { OrderbookData } from "../../orderbook/models/orderbook-data.model";
import { CommandBase } from "./command-base";
import { MathHelper } from "../../../shared/utils/math-helper";

export interface SubmitBestPriceOrderCommandArgs {
  instrumentKey: InstrumentKey;
  side: Side;
  quantity: number;
  targetPortfolio: string;
  orderBook: OrderbookData;
  bracketOptions: BracketOptions | null;
  priceStep: number;
  orderTracker?: LimitOrderTracker;
}

@Injectable()
export class SubmitBestPriceOrderCommand extends CommandBase<SubmitBestPriceOrderCommandArgs> {
  constructor(private readonly submitLimitOrderCommand: SubmitLimitOrderCommand) {
    super();
  }

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
      orderTracker: args.orderTracker
    });
  }
}
