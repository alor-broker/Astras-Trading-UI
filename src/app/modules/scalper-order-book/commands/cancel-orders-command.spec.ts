import { TestBed } from '@angular/core/testing';

import {
  CancelOrdersCommand,
  CancelOrdersCommandArgs
} from "./cancel-orders-command";
import { OrderType } from "../../../shared/models/orders/order.model";
import { of } from "rxjs";
import { TestingHelpers } from "../../../shared/utils/testing/testing-helpers";
import { OrderCommandService } from "../../../shared/services/orders/order-command.service";

describe('CancelOrdersCommand', () => {
  let command: CancelOrdersCommand;

  let orderServiceSpy: any;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj('OrderCommandService', ['cancelOrders']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: OrderCommandService,
          useValue: orderServiceSpy
        },
      ]
    });

    command = TestBed.inject(CancelOrdersCommand);
  });

  it('should be created', () => {
    expect(command).toBeTruthy();
  });

  it('#execute should call service with appropriate data', done => {
        const commandArgs: CancelOrdersCommandArgs = {
          ordersToCancel: [
            {
              orderId: TestingHelpers.generateRandomString(5),
              exchange: TestingHelpers.generateRandomString(4),
              portfolio: TestingHelpers.generateRandomString(5),
              orderType: OrderType.Limit
            }
          ]
        };

        orderServiceSpy.cancelOrders.and.callFake((requests: {
          orderId: string;
          portfolio: string;
          exchange: string;
          orderType: OrderType;
        }[]) => {
          done();

          expect(requests.length).toBe(1);

          const testOrder = commandArgs.ordersToCancel[0];

          expect(requests[0]).toEqual({
            orderId: testOrder.orderId,
            exchange: testOrder.exchange,
            portfolio: testOrder.portfolio,
            orderType: testOrder.orderType
          });

          return of([]);
        });

        command.execute(commandArgs);
      }

  );
});
