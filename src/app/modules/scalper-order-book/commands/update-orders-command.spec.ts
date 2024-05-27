import { TestBed } from '@angular/core/testing';
import { UpdateOrdersCommand } from "./update-orders-command";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";


describe('UpdateOrdersCommand', () => {
  let command: UpdateOrdersCommand;

  let orderServiceSpy: any;
  let ordersDialogServiceSpy: any;

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj('WsOrdersService', ['submitStopLimitOrder']);
    ordersDialogServiceSpy = jasmine.createSpyObj('OrdersDialogService', ['openNewOrderDialog']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WsOrdersService,
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
