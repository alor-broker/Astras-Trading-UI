import { Injectable } from '@angular/core';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Side } from "../../../shared/models/enums/side.model";
import { OrderbookData } from "../../orderbook/models/orderbook-data.model";
import {
  BracketOptions,
  LimitOrderTracker,
  SubmitLimitOrderCommand
} from "./submit-limit-order-command";
import { CommandBase } from "./command-base";

export interface GetBestOfferCommandArgs {
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
export class GetBestOfferCommand extends CommandBase<GetBestOfferCommandArgs> {
  constructor(private readonly submitLimitOrderCommand: SubmitLimitOrderCommand) {
    super();
  }

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
      orderTracker: args.orderTracker
    });
  }
}
