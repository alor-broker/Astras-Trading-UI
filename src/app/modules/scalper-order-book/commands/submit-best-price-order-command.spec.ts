import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import {
  SubmitLimitOrderCommand,
  SubmitLimitOrderCommandArgs
} from "./submit-limit-order-command";
import {
  SubmitBestPriceOrderCommand,
  SubmitBestPriceOrderCommandArgs
} from "./submit-best-price-order-command";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { OrderbookDataRow } from "../../orderbook/models/orderbook-data.model";
import { Side } from "../../../shared/models/enums/side.model";
import { PriceUnits } from "../models/scalper-order-book-settings.model";
import { TestingHelpers } from 'src/app/shared/utils/testing/testing-helpers';

describe('SubmitBestPriceOrderCommand', () => {
  let command: SubmitBestPriceOrderCommand;

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
    command = TestBed.inject(SubmitBestPriceOrderCommand);
  });

  it('should be created', () => {
    expect(command).toBeTruthy();
  });

  it('#execute should call service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: TestingHelpers.generateRandomString(4),
        portfolio: TestingHelpers.generateRandomString(5),
      };

      const symbol = TestingHelpers.generateRandomString(4);
      const testInstrument: Instrument = {
        exchange: portfolioKey.exchange,
        symbol: symbol,
        shortName: symbol,
        description: symbol,
        currency: 'RUB',
        minstep: 1
      };

      submitLimitOrderCommandSpy.execute.and.callThrough();
      const quantity = TestingHelpers.getRandomInt(1, 100);

      let testAsks: OrderbookDataRow[] = [
        { p: 6, v: 1, y: 0 },
        { p: 7, v: 1, y: 0 },
        { p: 8, v: 1, y: 0 },
      ];

      let testBids: OrderbookDataRow[] = [
        { p: testAsks[0].p - testInstrument.minstep * 2, v: 1, y: 0 },
        { p: testAsks[0].p - testInstrument.minstep * 3, v: 1, y: 0 },
        { p: testAsks[0].p - testInstrument.minstep * 4, v: 1, y: 0 }
      ];

      const args: SubmitBestPriceOrderCommandArgs = {
        instrumentKey: testInstrument,
        quantity,
        side: Side.Buy,
        targetPortfolio: portfolioKey.portfolio,
        orderBook: { a: testAsks, b: testBids },
        priceStep: testInstrument.minstep,
        bracketOptions: {
          profitPriceRatio: 1,
          lossPriceRatio: 2,
          orderPriceUnits: PriceUnits.Points,
          currentPosition: null,
          applyBracketOnClosing: false
        }
      };

      command.execute(args);
      tick(10000);

      expect(submitLimitOrderCommandSpy.execute)
        .withContext('Spread rows, Buy')
        .toHaveBeenCalledOnceWith(
          {
            instrumentKey: args.instrumentKey,
            side: args.side,
            quantity: args.quantity,
            price: testBids[0].p + testInstrument.minstep,
            priceStep: args.priceStep,
            targetPortfolio: args.targetPortfolio,
            bracketOptions: args.bracketOptions,
            silent: true,
            orderTracker: undefined
          } as SubmitLimitOrderCommandArgs
        );

      submitLimitOrderCommandSpy.execute.calls.reset();

      args.side = Side.Sell;
      command.execute(args);
      tick(10000);

      expect(submitLimitOrderCommandSpy.execute)
        .withContext('Spread rows, Sell')
        .toHaveBeenCalledOnceWith(
          {
            instrumentKey: args.instrumentKey,
            side: args.side,
            quantity: args.quantity,
            price: testAsks[0].p - testInstrument.minstep,
            priceStep: args.priceStep,
            targetPortfolio: args.targetPortfolio,
            bracketOptions: args.bracketOptions,
            silent: true,
            orderTracker: undefined
          } as SubmitLimitOrderCommandArgs
        );

      submitLimitOrderCommandSpy.execute.calls.reset();

      testAsks = [
        { p: 6, v: 1, y: 0 },
        { p: 7, v: 1, y: 0 },
        { p: 8, v: 1, y: 0 },
      ];

      testBids = [
        { p: testAsks[0].p - 1, v: 1, y: 0 },
        { p: testAsks[0].p - 2, v: 1, y: 0 },
        { p: testAsks[0].p - 3, v: 1, y: 0 }
      ];

      args.side = Side.Buy;
      args.orderBook = { a: testAsks, b: testBids };

      command.execute(args);
      tick(10000);

      expect(submitLimitOrderCommandSpy.execute)
        .withContext('No spread, Buy')
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

      submitLimitOrderCommandSpy.execute.calls.reset();
      args.side = Side.Sell;

      command.execute(args);
      tick(10000);

      expect(submitLimitOrderCommandSpy.execute)
        .withContext('No spread, Sell')
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
