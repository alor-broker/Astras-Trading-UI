import {Provider} from '@angular/core';
import {CancelOrdersCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/cancel-orders-command';
import {ClosePositionByMarketCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/close-position-by-market-command';
import {GetBestOfferCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/get-best-offer-command';
import {ReversePositionByMarketCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/reverse-position-by-market-command';
import {SetStopLossCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/set-stop-loss-command';
import {SubmitBestPriceOrderCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-best-price-order-command';
import {SubmitLimitOrderCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-limit-order-command';
import {SubmitMarketOrderCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-market-order-command';
import {SubmitStopLimitOrderCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/submit-stop-limit-order-command';
import {UpdateOrdersCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/update-orders-command';

export function provideCommands(): Provider[] {
  return [
    CancelOrdersCommand,
    ClosePositionByMarketCommand,
    GetBestOfferCommand,
    ReversePositionByMarketCommand,
    SetStopLossCommand,
    SubmitBestPriceOrderCommand,
    SubmitLimitOrderCommand,
    SubmitMarketOrderCommand,
    SubmitStopLimitOrderCommand,
    UpdateOrdersCommand
  ];
}
