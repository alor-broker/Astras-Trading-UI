import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { SubmitMarketOrderCommand } from "./submit-market-order-command";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { of } from "rxjs";
import { Side } from "../../../shared/models/enums/side.model";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { NewMarketOrder } from "../../../shared/models/orders/new-order.model";
import {
  OrderDialogParams,
  OrderFormType
} from "../../../shared/models/orders/orders-dialog.model";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { TestingHelpers } from "../../../shared/utils/testing/testing-helpers";
import { OrderCommandService } from "../../../shared/services/orders/order-command.service";

describe('SubmitMarketOrderCommand', () => {
  let command: SubmitMarketOrderCommand;

  let orderServiceSpy: any;
  let ordersDialogServiceSpy: any;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj('OrderCommandService', ['submitMarketOrder']);
    ordersDialogServiceSpy = jasmine.createSpyObj('OrdersDialogService', ['openNewOrderDialog']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: OrderCommandService,
          useValue: orderServiceSpy
        },
        {
          provide: OrdersDialogService,
          useValue: ordersDialogServiceSpy
        },
      ]
    });
    command = TestBed.inject(SubmitMarketOrderCommand);
  });

  it('should be created', () => {
    expect(command).toBeTruthy();
  });

  it('#execute should call appropriate service with appropriate data', fakeAsync(() => {
      const portfolioKey: PortfolioKey = {
        exchange: TestingHelpers.generateRandomString(4),
        portfolio: TestingHelpers.generateRandomString(5),
      };

      const testInstrumentKey: InstrumentKey = {
        exchange: portfolioKey.exchange,
        symbol: TestingHelpers.generateRandomString(4)
      };

      orderServiceSpy.submitMarketOrder.and.returnValue(of({}));
      const quantity = TestingHelpers.getRandomInt(1, 100);

      command.execute({
        instrumentKey: testInstrumentKey,
        side: Side.Sell,
        quantity,
        targetPortfolio: portfolioKey.portfolio,
        silent: true
      });

      tick(10000);
      expect(orderServiceSpy.submitMarketOrder)
        .withContext('Sell')
        .toHaveBeenCalledOnceWith(
          {
            side: Side.Sell,
            quantity,
            instrument: toInstrumentKey(testInstrumentKey)
          } as NewMarketOrder,
          portfolioKey.portfolio
        );

      command.execute({
        instrumentKey: testInstrumentKey,
        side: Side.Buy,
        quantity,
        targetPortfolio: portfolioKey.portfolio,
        silent: false
      });

      tick(10000);
      expect(ordersDialogServiceSpy.openNewOrderDialog)
        .withContext('Buy')
        .toHaveBeenCalledOnceWith(
          {
            instrumentKey: toInstrumentKey(testInstrumentKey),
            initialValues: {
              orderType: OrderFormType.Market,
              quantity
            }
          } as OrderDialogParams
        );
    })
  );
});
