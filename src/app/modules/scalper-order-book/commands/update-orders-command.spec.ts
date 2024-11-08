import { TestBed } from '@angular/core/testing';
import { UpdateOrdersCommand } from "./update-orders-command";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
} from "../../../shared/services/orders/order-command.service";

describe('UpdateOrdersCommand', () => {
  let command: UpdateOrdersCommand;

  let orderServiceSpy: any;
  let ordersDialogServiceSpy: any;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj(
      'OrderCommandService',
      [
        'submitLimitOrderEdit',
        'submitStopLimitOrderEdit',
        'submitStopMarketOrderEdit'
      ]
    );
    ordersDialogServiceSpy = jasmine.createSpyObj('OrdersDialogService', ['openNewOrderDialog']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UpdateOrdersCommand,
        {
          provide: ORDER_COMMAND_SERVICE_TOKEN,
          useValue: orderServiceSpy
        },
        {
          provide: OrdersDialogService,
          useValue: ordersDialogServiceSpy
        },
      ]
    });
    command = TestBed.inject(UpdateOrdersCommand);
  });

  it('should be created', () => {
    expect(command).toBeTruthy();
  });
});
