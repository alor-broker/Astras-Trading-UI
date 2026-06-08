import {TestBed} from '@angular/core/testing';
import {
  firstValueFrom,
  of
} from 'rxjs';
import {ConfirmableOrderCommandsService} from './confirmable-order-commands.service';
import {
  MarginOrderConfirmationService,
  TargetPortfolio
} from './margin-order-notification.service';
import {ORDER_COMMAND_SERVICE_TOKEN} from '../types/order-command-service.types';
import {
  NewLimitOrder,
  NewLinkedOrder,
  OrderCommandResult
} from '../types/new-order.types';
import {ExecutionPolicy} from '../types/order-group.types';
import {OrderType} from '../types/orders.types';

describe('ConfirmableOrderCommandsService', () => {
  const targetPortfolio: TargetPortfolio = {portfolio: 'D1234', exchange: 'MOEX'};
  const commandResult: OrderCommandResult = {isSuccess: true, message: 'ok', orderNumber: '1'};

  let service: ConfirmableOrderCommandsService;
  let orderCommandSpy: {
    submitLimitOrder: ReturnType<typeof vi.fn>;
    submitOrdersGroup: ReturnType<typeof vi.fn>;
    cancelOrders: ReturnType<typeof vi.fn>;
    getOrdersConfig: ReturnType<typeof vi.fn>;
  };
  let checkWithConfirmation: ReturnType<typeof vi.fn>;

  function setup(confirmationResult: boolean | null): void {
    orderCommandSpy = {
      submitLimitOrder: vi.fn().mockReturnValue(of(commandResult)),
      submitOrdersGroup: vi.fn().mockReturnValue(of({message: 'success', groupId: 'group-1'})),
      cancelOrders: vi.fn().mockReturnValue(of([commandResult])),
      getOrdersConfig: vi.fn().mockReturnValue({orderTypes: []})
    };
    checkWithConfirmation = vi.fn().mockReturnValue(of(confirmationResult));

    TestBed.configureTestingModule({
      providers: [
        ConfirmableOrderCommandsService,
        {provide: ORDER_COMMAND_SERVICE_TOKEN, useValue: orderCommandSpy},
        {provide: MarginOrderConfirmationService, useValue: {checkWithConfirmation}}
      ]
    });

    service = TestBed.inject(ConfirmableOrderCommandsService);
  }

  function createLimitOrder(): NewLimitOrder {
    return {price: 100} as unknown as NewLimitOrder;
  }

  describe('submitLimitOrder', () => {
    it('should set allowMargin to true and delegate when the margin order is confirmed', async () => {
      setup(true);
      const order = createLimitOrder();

      const result = await firstValueFrom(service.submitLimitOrder(order, targetPortfolio));

      expect(result).toEqual(commandResult);
      expect(order.allowMargin).toBe(true);
      expect(orderCommandSpy.submitLimitOrder).toHaveBeenCalledWith(order, targetPortfolio.portfolio);
    });

    it('should set allowMargin to false when the confirmation is declined', async () => {
      setup(false);
      const order = createLimitOrder();

      await firstValueFrom(service.submitLimitOrder(order, targetPortfolio));

      expect(order.allowMargin).toBe(false);
    });

    it('should leave allowMargin undefined when no confirmation decision is made', async () => {
      setup(null);
      const order = createLimitOrder();

      await firstValueFrom(service.submitLimitOrder(order, targetPortfolio));

      expect(order.allowMargin).toBeUndefined();
    });

    it('should run the margin confirmation for the target portfolio', async () => {
      setup(true);

      await firstValueFrom(service.submitLimitOrder(createLimitOrder(), targetPortfolio));

      expect(checkWithConfirmation).toHaveBeenCalledWith(targetPortfolio);
    });
  });

  describe('submitOrdersGroup', () => {
    function createLinkedOrder(): NewLinkedOrder {
      return {type: OrderType.Limit} as unknown as NewLinkedOrder;
    }

    it('should apply the margin confirmation result to every grouped order', async () => {
      setup(true);
      const orders = [
        createLinkedOrder(),
        createLinkedOrder()
      ];

      const result = await firstValueFrom(service.submitOrdersGroup(
        orders,
        targetPortfolio,
        ExecutionPolicy.OnExecuteOrCancel
      ));

      expect(result).toEqual({message: 'success', groupId: 'group-1'});
      expect(orders.every(order => order.allowMargin === true)).toBe(true);
      expect(orderCommandSpy.submitOrdersGroup).toHaveBeenCalledWith(
        orders,
        targetPortfolio.portfolio,
        ExecutionPolicy.OnExecuteOrCancel
      );
    });

    it('should leave grouped orders without allowMargin when confirmation has no decision', async () => {
      setup(null);
      const orders = [
        createLinkedOrder(),
        createLinkedOrder()
      ];

      await firstValueFrom(service.submitOrdersGroup(
        orders,
        targetPortfolio,
        ExecutionPolicy.IgnoreCancel
      ));

      expect(orders.every(order => order.allowMargin === undefined)).toBe(true);
    });
  });

  describe('direct delegation', () => {
    it('should forward cancelOrders to the order command service', async () => {
      setup(true);
      const requests = [{orderId: '1', portfolio: 'D1234', exchange: 'MOEX', orderType: 'limit' as never}];

      const result = await firstValueFrom(service.cancelOrders(requests));

      expect(result).toEqual([commandResult]);
      expect(orderCommandSpy.cancelOrders).toHaveBeenCalledWith(requests);
    });

    it('should forward getOrdersConfig to the order command service', () => {
      setup(true);

      const config = service.getOrdersConfig();

      expect(config).toEqual({orderTypes: []});
      expect(orderCommandSpy.getOrdersConfig).toHaveBeenCalledTimes(1);
    });
  });
});
