import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {
  firstValueFrom,
  of
} from 'rxjs';
import {getUnixTime} from 'date-fns';
import {ClientOrderCommandService} from './client-order-command.service';
import {WsOrdersConnector} from './ws-orders-connector';
import {InstrumentsService} from '../../instruments/services/instruments.service';
import {OrderInstantTranslatableNotificationsService} from './order-instant-translatable-notifications.service';
import {EventsBusService} from '@terminal-core-lib/common/services/events-bus.service';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {TradingStatus} from '../../../common/types/instrument.types';
import {
  OrderType,
  TimeInForce
} from '../types/orders.types';
import {
  NewLimitOrder,
  NewLinkedOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder
} from '../types/new-order.types';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {ExecutionPolicy} from '../types/order-group.types';
import {Side} from '../../../common/types/side.types';
import {Condition} from '../../../common/types/condition.types';
import {
  LimitOrderEdit,
  StopLimitOrderEdit,
  StopMarketOrderEdit
} from '../types/edit-order.types';

describe('ClientOrderCommandService', () => {
  const portfolio = 'D1234';

  let service: ClientOrderCommandService;
  let httpTestingController: HttpTestingController;
  let submitCommand: ReturnType<typeof vi.fn>;
  let getInstrument: ReturnType<typeof vi.fn>;
  let notifications: Record<string, ReturnType<typeof vi.fn>>;
  let eventBus: { publish: ReturnType<typeof vi.fn> };

  function setSuccessResponse(orderNumber = '42'): void {
    submitCommand.mockReturnValue(of({requestGuid: 'g', httpCode: 200, message: 'success', orderNumber}));
  }

  function lastCommand(): Record<string, unknown> {
    return submitCommand.mock.calls.at(-1)![0] as Record<string, unknown>;
  }

  function createLimitOrder(overrides: Partial<NewLimitOrder> = {}): NewLimitOrder {
    return {
      instrument: InstrumentFixtures.createInstrumentKey({instrumentGroup: 'TQBR'}),
      side: Side.Buy,
      quantity: 10,
      price: 100,
      ...overrides
    } as unknown as NewLimitOrder;
  }

  function expectCommonOrderCommand(
    command: Record<string, unknown>,
    expected: {
      opcode: string;
      side: Side;
      quantity: number;
      portfolio?: string;
      board?: string;
    }
  ): void {
    expect(command.opcode).toBe(expected.opcode);
    expect(command.instrument).toEqual({symbol: 'SBER', exchange: 'MOEX'});
    expect(command.board).toBe(expected.board ?? 'TQBR');
    expect(command.user).toEqual({portfolio: expected.portfolio ?? portfolio});
    expect(command.side).toBe(expected.side);
    expect(command.quantity).toBe(expected.quantity);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    submitCommand = vi.fn().mockReturnValue(of({requestGuid: 'g', httpCode: 200, message: 'success', orderNumber: '42'}));
    getInstrument = vi.fn().mockReturnValue(of(null));
    notifications = {
      orderCreated: vi.fn(),
      orderSubmitFailed: vi.fn(),
      orderUpdated: vi.fn(),
      orderUpdateFailed: vi.fn(),
      orderCancelled: vi.fn(),
      orderCancelFailed: vi.fn(),
      ordersGroupCreated: vi.fn()
    };
    eventBus = {publish: vi.fn()};

    TestBed.configureTestingModule({
      providers: [
        ClientOrderCommandService,
        {provide: WsOrdersConnector, useValue: {warmUp: vi.fn(), submitCommand}},
        {provide: InstrumentsService, useValue: {getInstrument}},
        {provide: OrderInstantTranslatableNotificationsService, useValue: notifications},
        {provide: EventsBusService, useValue: eventBus},
        {provide: CORE_API_URL_PROVIDER, useValue: {apiUrl: 'https://api.test'}},
        {provide: ErrorHandlerService, useValue: {handleError: vi.fn()}},
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ClientOrderCommandService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    vi.useRealTimers();
  });

  it('should warm up the orders connector on construction', () => {
    expect(TestBed.inject(WsOrdersConnector).warmUp).toHaveBeenCalled();
  });

  describe('submitLimitOrder', () => {
    it('should build a create:Limit command from the order', async () => {
      const result = await firstValueFrom(service.submitLimitOrder(createLimitOrder({
        timeInForce: TimeInForce.FillOrKill
      }), portfolio));

      const command = lastCommand();
      expectCommonOrderCommand(command, {
        opcode: 'create:limit',
        side: Side.Buy,
        quantity: 10
      });
      expect(command.price).toBe(100);
      expect(command.timeInForce).toBe(TimeInForce.FillOrKill);
      expect(command).not.toHaveProperty('allowMargin');
      expect(result).toEqual({isSuccess: true, message: 'success', orderNumber: '42'});
    });

    it('should map a non-200 response to a failed result', async () => {
      submitCommand.mockReturnValue(of({requestGuid: 'g', httpCode: 400, message: 'rejected'}));

      const result = await firstValueFrom(service.submitLimitOrder(createLimitOrder(), portfolio));

      expect(result).toEqual({isSuccess: false, message: 'rejected', orderNumber: undefined});
    });

    it('should keep allowMargin when it is set on the order', async () => {
      await firstValueFrom(service.submitLimitOrder(createLimitOrder({allowMargin: true}), portfolio));

      expect(lastCommand().allowMargin).toBe(true);
    });

    it('should serialize order meta into the comment field', async () => {
      const meta = {tradingType: 'manual'};
      await firstValueFrom(service.submitLimitOrder(createLimitOrder({meta} as Partial<NewLimitOrder>), portfolio));

      expect(lastCommand().comment).toBe(JSON.stringify({meta}));
    });

    it('should notify about a created order on success', async () => {
      setSuccessResponse('99');

      await firstValueFrom(service.submitLimitOrder(createLimitOrder(), portfolio));
      vi.runAllTimers();

      expect(notifications.orderCreated).toHaveBeenCalledWith('99');
    });
  });

  describe('submitMarketOrder', () => {
    function createMarketOrder(overrides: Partial<NewMarketOrder> = {}): NewMarketOrder {
      return {
        instrument: InstrumentFixtures.createInstrumentKey({instrumentGroup: 'TQBR'}),
        side: Side.Sell,
        quantity: 5,
        ...overrides
      } as unknown as NewMarketOrder;
    }

    it('should build a create:Market command from the order', async () => {
      await firstValueFrom(service.submitMarketOrder(createMarketOrder({
        allowMargin: true,
        timeInForce: TimeInForce.ImmediateOrCancel
      }), portfolio));

      const command = lastCommand();
      expectCommonOrderCommand(command, {
        opcode: 'create:market',
        side: Side.Sell,
        quantity: 5
      });
      expect(command.timeInForce).toBe(TimeInForce.ImmediateOrCancel);
      expect(command.allowMargin).toBe(true);
      expect(command).not.toHaveProperty('price');
    });

    it('should force a one-day time-in-force during an auction', async () => {
      getInstrument.mockReturnValue(of({tradingStatus: TradingStatus.OpeningAuction}));

      await firstValueFrom(service.submitMarketOrder(createMarketOrder(), portfolio));

      const command = lastCommand();
      expect(command.opcode).toBe('create:market');
      expect(command.timeInForce).toBe('oneday');
    });

    it('should not set a time-in-force outside of an auction', async () => {
      getInstrument.mockReturnValue(of({tradingStatus: TradingStatus.NormalPeriod}));

      await firstValueFrom(service.submitMarketOrder(createMarketOrder(), portfolio));

      expect(lastCommand()).not.toHaveProperty('timeInForce');
    });
  });

  describe('submitStopMarketOrder', () => {
    function createStopOrder(stopEndUnixTime?: Date, overrides: Partial<NewStopMarketOrder> = {}): NewStopMarketOrder {
      return {
        instrument: InstrumentFixtures.createInstrumentKey({instrumentGroup: 'TQBR'}),
        side: Side.Sell,
        quantity: 1,
        triggerPrice: 90,
        condition: Condition.LessOrEqual,
        stopEndUnixTime,
        ...overrides
      } as unknown as NewStopMarketOrder;
    }

    it('should convert a stop end date to a unix timestamp', async () => {
      const stopEnd = new Date('2026-01-01T00:00:00Z');

      await firstValueFrom(service.submitStopMarketOrder(createStopOrder(stopEnd), portfolio));

      const command = lastCommand();
      expectCommonOrderCommand(command, {
        opcode: 'create:stop',
        side: Side.Sell,
        quantity: 1
      });
      expect(command.triggerPrice).toBe(90);
      expect(command.condition).toBe(Condition.LessOrEqual);
      expect(command.stopEndUnixTime).toBe(getUnixTime(stopEnd));
    });

    it('should use 0 when no stop end date is provided', async () => {
      await firstValueFrom(service.submitStopMarketOrder(createStopOrder(), portfolio));

      expect(lastCommand().stopEndUnixTime).toBe(0);
    });
  });

  describe('submitStopLimitOrder', () => {
    function createStopLimitOrder(overrides: Partial<NewStopLimitOrder> = {}): NewStopLimitOrder {
      return {
        instrument: InstrumentFixtures.createInstrumentKey({instrumentGroup: 'TQBR'}),
        side: Side.Buy,
        quantity: 3,
        triggerPrice: 95,
        condition: Condition.MoreOrEqual,
        price: 96,
        stopEndUnixTime: new Date('2026-01-02T00:00:00Z'),
        timeInForce: TimeInForce.GoodTillCancelled,
        allowMargin: true,
        ...overrides
      } as unknown as NewStopLimitOrder;
    }

    it('should build a create:StopLimit command from the order', async () => {
      await firstValueFrom(service.submitStopLimitOrder(createStopLimitOrder(), portfolio));

      const command = lastCommand();
      expectCommonOrderCommand(command, {
        opcode: 'create:stoplimit',
        side: Side.Buy,
        quantity: 3
      });
      expect(command.triggerPrice).toBe(95);
      expect(command.condition).toBe(Condition.MoreOrEqual);
      expect(command.price).toBe(96);
      expect(command.timeInForce).toBe(TimeInForce.GoodTillCancelled);
      expect(command.allowMargin).toBe(true);
      expect(command.stopEndUnixTime).toBe(getUnixTime(new Date('2026-01-02T00:00:00Z')));
    });
  });

  describe('edit orders', () => {
    it('should build an update:Limit command from the edit request', async () => {
      const edit: LimitOrderEdit = {
        ...createLimitOrder({
          price: 111,
          quantity: 12,
          side: Side.Sell,
          allowMargin: true,
          timeInForce: TimeInForce.AtTheClose
        }),
        orderId: 'order-1'
      };

      await firstValueFrom(service.submitLimitOrderEdit(edit, portfolio));

      const command = lastCommand();
      expectCommonOrderCommand(command, {
        opcode: 'update:limit',
        side: Side.Sell,
        quantity: 12
      });
      expect(command.orderId).toBe('order-1');
      expect(command.price).toBe(111);
      expect(command.timeInForce).toBe(TimeInForce.AtTheClose);
      expect(command.allowMargin).toBe(true);
    });

    it('should build an update:Stop command from the edit request', async () => {
      const edit: StopMarketOrderEdit = {
        instrument: InstrumentFixtures.createInstrumentKey({instrumentGroup: 'TQBR'}),
        side: Side.Buy,
        quantity: 2,
        triggerPrice: 88,
        condition: Condition.More,
        stopEndUnixTime: new Date('2026-01-03T00:00:00Z'),
        orderId: 'stop-1'
      };

      await firstValueFrom(service.submitStopMarketOrderEdit(edit, portfolio));

      const command = lastCommand();
      expectCommonOrderCommand(command, {
        opcode: 'update:stop',
        side: Side.Buy,
        quantity: 2
      });
      expect(command.orderId).toBe('stop-1');
      expect(command.triggerPrice).toBe(88);
      expect(command.condition).toBe(Condition.More);
      expect(command.stopEndUnixTime).toBe(getUnixTime(new Date('2026-01-03T00:00:00Z')));
      expect(command).not.toHaveProperty('price');
    });

    it('should build an update:StopLimit command from the edit request', async () => {
      const edit: StopLimitOrderEdit = {
        instrument: InstrumentFixtures.createInstrumentKey({instrumentGroup: 'TQBR'}),
        side: Side.Sell,
        quantity: 4,
        triggerPrice: 87,
        condition: Condition.Less,
        price: 86,
        stopEndUnixTime: new Date('2026-01-04T00:00:00Z'),
        timeInForce: TimeInForce.FillOrKill,
        orderId: 'stop-limit-1'
      };

      await firstValueFrom(service.submitStopLimitOrderEdit(edit, portfolio));

      const command = lastCommand();
      expectCommonOrderCommand(command, {
        opcode: 'update:stoplimit',
        side: Side.Sell,
        quantity: 4
      });
      expect(command.orderId).toBe('stop-limit-1');
      expect(command.triggerPrice).toBe(87);
      expect(command.condition).toBe(Condition.Less);
      expect(command.price).toBe(86);
      expect(command.timeInForce).toBe(TimeInForce.FillOrKill);
      expect(command.stopEndUnixTime).toBe(getUnixTime(new Date('2026-01-04T00:00:00Z')));
    });
  });

  describe('cancelOrders', () => {
    it('should send a delete command per request and collect the results', async () => {
      const results = await firstValueFrom(service.cancelOrders([
        {orderId: '1', portfolio, exchange: 'MOEX', orderType: OrderType.Limit}
      ]));

      const command = lastCommand();
      expect(command.opcode).toBe('delete:limit');
      expect(command.orderId).toBe('1');
      expect(command.exchange).toBe('MOEX');
      expect(command.user).toEqual({portfolio});
      expect(results).toEqual([{isSuccess: true, message: 'success', orderNumber: '42'}]);
    });
  });

  describe('submitOrdersGroup', () => {
    function createLinkedLimitOrder(overrides: Partial<NewLinkedOrder> = {}): NewLinkedOrder {
      return {
        ...createLimitOrder(),
        type: OrderType.Limit,
        ...overrides
      } as NewLinkedOrder;
    }

    it('should create a backend order group from successfully submitted orders', async () => {
      submitCommand
        .mockReturnValueOnce(of({requestGuid: 'g1', httpCode: 200, message: 'success', orderNumber: '101'}))
        .mockReturnValueOnce(of({requestGuid: 'g2', httpCode: 200, message: 'success', orderNumber: '102'}));

      const result$ = firstValueFrom(service.submitOrdersGroup(
        [
          createLinkedLimitOrder({instrument: InstrumentFixtures.createInstrumentKey({symbol: 'SBER', exchange: 'MOEX'})}),
          createLinkedLimitOrder({instrument: InstrumentFixtures.createInstrumentKey({symbol: 'GAZP', exchange: 'MOEX'})})
        ],
        portfolio,
        ExecutionPolicy.OnExecuteOrCancel
      ));

      const req = httpTestingController.expectOne('https://api.test/commandapi/api/orderGroups');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        orders: [
          {orderId: '101', exchange: 'MOEX', portfolio, type: 'Limit'},
          {orderId: '102', exchange: 'MOEX', portfolio, type: 'Limit'}
        ],
        executionPolicy: ExecutionPolicy.OnExecuteOrCancel
      });

      req.flush({message: 'success', groupId: 'group-1'});

      await expect(result$).resolves.toEqual({message: 'success', groupId: 'group-1'});
      expect(eventBus.publish).toHaveBeenCalledWith({key: 'OrdersGroupCreatedEvent'});
    });

    it('should rollback already submitted orders when a later order in the group fails', async () => {
      submitCommand
        .mockReturnValueOnce(of({requestGuid: 'g1', httpCode: 200, message: 'success', orderNumber: '101'}))
        .mockReturnValueOnce(of({requestGuid: 'g2', httpCode: 400, message: 'rejected'}))
        .mockReturnValueOnce(of({requestGuid: 'g3', httpCode: 200, message: 'success', orderNumber: '101'}));

      const result = await firstValueFrom(service.submitOrdersGroup(
        [
          createLinkedLimitOrder({instrument: InstrumentFixtures.createInstrumentKey({symbol: 'SBER', exchange: 'MOEX'})}),
          createLinkedLimitOrder({instrument: InstrumentFixtures.createInstrumentKey({symbol: 'GAZP', exchange: 'MOEX'})})
        ],
        portfolio,
        ExecutionPolicy.OnExecuteOrCancel
      ));

      httpTestingController.expectNone('https://api.test/commandapi/api/orderGroups');
      expect(result).toBeNull();
      expect(submitCommand).toHaveBeenCalledTimes(3);
      expect(submitCommand.mock.calls[2][0]).toMatchObject({
        opcode: 'delete:limit',
        orderId: '101',
        exchange: 'MOEX',
        user: {portfolio}
      });
    });
  });

  describe('getOrdersConfig', () => {
    it('should report supported order types', () => {
      const config = service.getOrdersConfig();

      expect(config.limitOrder.isSupported).toBe(true);
      expect(config.limitOrder.orderConfig?.isBracketsSupported).toBe(true);
      expect(config.marketOrder.isSupported).toBe(true);
      expect(config.stopOrder.isSupported).toBe(true);
    });
  });
});
