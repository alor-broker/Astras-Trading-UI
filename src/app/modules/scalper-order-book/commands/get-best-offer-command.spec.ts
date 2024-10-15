import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import {
  GetBestOfferCommand,
  GetBestOfferCommandArgs
} from "./get-best-offer-command";
import {
  SubmitLimitOrderCommand,
  SubmitLimitOrderCommandArgs
} from "./submit-limit-order-command";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { OrderbookDataRow } from "../../orderbook/models/orderbook-data.model";
import { Side } from "../../../shared/models/enums/side.model";
import { PriceUnits } from "../models/scalper-order-book-settings.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { TestingHelpers } from "../../../shared/utils/testing/testing-helpers";

describe('GetBestOfferCommand', () => {
  let command: GetBestOfferCommand;

  let submitLimitOrderCommandSpy: any;

  beforeEach(() => {
    submitLimitOrderCommandSpy = jasmine.createSpyObj('SubmitLimitOrderCommand', ['execute']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SubmitLimitOrderCommand,
          useValue: submitLimitOrderCommandSpy
        }
      ]
    });
    command = TestBed.inject(GetBestOfferCommand);
  });

  it('should be created', () => {
    expect(command).toBeTruthy();
  });

  it('#sellBestBid should call service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: TestingHelpers.generateRandomString(4),
        portfolio: TestingHelpers.generateRandomString(5),
      };

      const symbol = TestingHelpers.generateRandomString(4);
      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: symbol
      };

      submitLimitOrderCommandSpy.execute.and.callThrough();
      const quantity = TestingHelpers.getRandomInt(1, 100);

      const testAsks: OrderbookDataRow[] = [
        { p: 6, v: 1, y: 0 },
        { p: 7, v: 1, y: 0 },
        { p: 8, v: 1, y: 0 },
      ];

      const testBids: OrderbookDataRow[] = [
        { p: testAsks[0].p - 1, v: 1, y: 0 },
        { p: testAsks[0].p - 2, v: 1, y: 0 },
        { p: testAsks[0].p - 3, v: 1, y: 0 }
      ];

      const args: GetBestOfferCommandArgs = {
        instrumentKey: testInstrumentKey,
        side: Side.Sell,
        quantity,
        targetPortfolio: portfolioKey.portfolio,
        orderBook: { a: testAsks, b: testBids },
        bracketOptions: {
          profitPriceRatio: 1,
          lossPriceRatio: 2,
          orderPriceUnits: PriceUnits.Points,
          currentPosition: null,
          applyBracketOnClosing: false
        },
        priceStep: 1
      };

      command.execute(args);

      tick(10000);

      expect(submitLimitOrderCommandSpy.execute)
        .toHaveBeenCalledOnceWith(
          {
            instrumentKey: args.instrumentKey,
            side: args.side,
            quantity: args.quantity,
            price: testBids[0].p,
            priceStep: args.priceStep,
            targetPortfolio: args.targetPortfolio,
            bracketOptions: args.bracketOptions,
            silent: true,
            orderTracker: undefined
          } as SubmitLimitOrderCommandArgs
        );
    })
  );

  it('#buyBestAsk should call service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: TestingHelpers.generateRandomString(4),
        portfolio: TestingHelpers.generateRandomString(5),
      };

      const symbol = TestingHelpers.generateRandomString(4);
      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: symbol
      };

      submitLimitOrderCommandSpy.execute.and.callThrough();
      const quantity = TestingHelpers.getRandomInt(1, 100);

      const testAsks: OrderbookDataRow[] = [
        { p: 6, v: 1, y: 0 },
        { p: 7, v: 1, y: 0 },
        { p: 8, v: 1, y: 0 },
      ];

      const testBids: OrderbookDataRow[] = [
        { p: testAsks[0].p - 1, v: 1, y: 0 },
        { p: testAsks[0].p - 2, v: 1, y: 0 },
        { p: testAsks[0].p - 3, v: 1, y: 0 }
      ];

      const args: GetBestOfferCommandArgs = {
        instrumentKey: testInstrumentKey,
        side: Side.Buy,
        quantity,
        targetPortfolio: portfolioKey.portfolio,
        orderBook: { a: testAsks, b: testBids },
        bracketOptions: {
          profitPriceRatio: 1,
          lossPriceRatio: 2,
          orderPriceUnits: PriceUnits.Points,
          currentPosition: null,
          applyBracketOnClosing: false,
        },
        priceStep: 1
      };

      command.execute(args);

      tick(10000);

      expect(submitLimitOrderCommandSpy.execute)
        .toHaveBeenCalledOnceWith(
          {
            instrumentKey: args.instrumentKey,
            side: args.side,
            quantity: args.quantity,
            price: testAsks[0].p,
            priceStep: args.priceStep,
            targetPortfolio: args.targetPortfolio,
            bracketOptions: args.bracketOptions,
            silent: true,
            orderTracker: undefined
          } as SubmitLimitOrderCommandArgs
        );
    })
  );
});
