import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
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
import {OrderType} from '../types/orders.types';
import {
  NewLimitOrder,
  NewMarketOrder,
  NewStopMarketOrder
} from '../types/new-order.types';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';

describe('ClientOrderCommandService', () => {
  const portfolio = 'D1234';

  let service: ClientOrderCommandService;
  let submitCommand: ReturnType<typeof vi.fn>;
  let getInstrument: ReturnType<typeof vi.fn>;
  let notifications: Record<string, ReturnType<typeof vi.fn>>;

  function setSuccessResponse(orderNumber = '42'): void {
    submitCommand.mockReturnValue(of({requestGuid: 'g', httpCode: 200, message: 'success', orderNumber}));
  }

  function lastCommand(): Record<string, unknown> {
    return submitCommand.mock.calls.at(-1)![0] as Record<string, unknown>;
  }

  function createLimitOrder(overrides: Partial<NewLimitOrder> = {}): NewLimitOrder {
    return {
      instrument: InstrumentFixtures.createInstrumentKey({instrumentGroup: 'TQBR'}),
      quantity: 10,
      price: 100,
      ...overrides
    } as unknown as NewLimitOrder;
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

    TestBed.configureTestingModule({
      providers: [
        ClientOrderCommandService,
        {provide: WsOrdersConnector, useValue: {warmUp: vi.fn(), submitCommand}},
        {provide: InstrumentsService, useValue: {getInstrument}},
        {provide: OrderInstantTranslatableNotificationsService, useValue: notifications},
        {provide: EventsBusService, useValue: {publish: vi.fn()}},
        {provide: CORE_API_URL_PROVIDER, useValue: {apiUrl: 'https://api.test'}},
        {provide: ErrorHandlerService, useValue: {handleError: vi.fn()}},
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ClientOrderCommandService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should warm up the orders connector on construction', () => {
    expect(TestBed.inject(WsOrdersConnector).warmUp).toHaveBeenCalled();
  });

  describe('submitLimitOrder', () => {
    it('should build a create:Limit command from the order', async () => {
      const result = await firstValueFrom(service.submitLimitOrder(createLimitOrder(), portfolio));

      const command = lastCommand();
      expect(command.opcode).toBe('create:limit');
      expect(command.instrument).toEqual({symbol: 'SBER', exchange: 'MOEX'});
      expect(command.board).toBe('TQBR');
      expect(command.user).toEqual({portfolio});
      expect(command.price).toBe(100);
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
    function createMarketOrder(): NewMarketOrder {
      return {instrument: InstrumentFixtures.createInstrumentKey(), quantity: 5} as unknown as NewMarketOrder;
    }

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
    function createStopOrder(stopEndUnixTime?: Date): NewStopMarketOrder {
      return {
        instrument: InstrumentFixtures.createInstrumentKey(),
        quantity: 1,
        stopEndUnixTime
      } as unknown as NewStopMarketOrder;
    }

    it('should convert a stop end date to a unix timestamp', async () => {
      const stopEnd = new Date('2026-01-01T00:00:00Z');

      await firstValueFrom(service.submitStopMarketOrder(createStopOrder(stopEnd), portfolio));

      const command = lastCommand();
      expect(command.opcode).toBe('create:stop');
      expect(command.stopEndUnixTime).toBe(getUnixTime(stopEnd));
    });

    it('should use 0 when no stop end date is provided', async () => {
      await firstValueFrom(service.submitStopMarketOrder(createStopOrder(), portfolio));

      expect(lastCommand().stopEndUnixTime).toBe(0);
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
