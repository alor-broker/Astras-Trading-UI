import {TestBed} from '@angular/core/testing';
import {
  firstValueFrom,
  of,
  Subscription
} from 'rxjs';
import {
  CommandResponse,
  WsOrdersConnector
} from './ws-orders-connector';
import {WEB_SOCKET_ORDERS_URL_PROVIDER} from '../../../config/api-url-providers';
import {ApiTokenProviderService} from '../../http-requests/services/api-token-provider.service';
import {LoggerService} from '../../logging/services/logger-service';
import {RXJS_WEBSOCKET_CTOR} from '../../../common/constants/web-socket.constants';
import {ApplicationStatusService} from '../../../common/services/application-status.service';
import {DeviceNetworkService} from '../../../common/services/device-network.service';

interface OutgoingMessage {
  guid: string;
  opcode: string;
  originator?: string;
  token?: string;
}

/**
 * Minimal stand-in for the rxjs `WebSocketSubject`. On every outgoing message it
 * synchronously echoes a successful response carrying the same `requestGuid`, which is
 * exactly how the connector correlates requests with responses.
 */
class FakeWebSocketSubject {
  closed = false;
  readonly outgoing: OutgoingMessage[] = [];

  private readonly observers: { next?: (value: CommandResponse) => void }[] = [];

  constructor(
    private readonly closeObserver?: { next: (event: CloseEvent) => void }
  ) {
  }

  subscribe(observer?: { next?: (value: CommandResponse) => void }): Subscription {
    const target = observer ?? {};
    this.observers.push(target);

    return new Subscription(() => {
      const index = this.observers.indexOf(target);
      if (index >= 0) {
        this.observers.splice(index, 1);
      }
    });
  }

  next(message: OutgoingMessage): void {
    this.outgoing.push(message);
    const response: CommandResponse = {
      requestGuid: message.guid,
      httpCode: 200,
      message: 'success',
      orderNumber: '777'
    };

    [...this.observers].forEach(observer => observer.next?.(response));
  }

  triggerClose(event: Partial<CloseEvent> = {}): void {
    this.closed = true;
    this.closeObserver?.next({
      code: event.code ?? 1006,
      reason: event.reason ?? 'test close'
    } as CloseEvent);
  }
}

describe('WsOrdersConnector', () => {
  let service: WsOrdersConnector;
  let sockets: FakeWebSocketSubject[];
  let factory: ReturnType<typeof vi.fn>;
  let getToken: ReturnType<typeof vi.fn>;

  function currentSocket(): FakeWebSocketSubject {
    return sockets.at(-1)!;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    sockets = [];
    factory = vi.fn().mockImplementation((config: { closeObserver?: { next: (event: CloseEvent) => void } }) => {
      const socket = new FakeWebSocketSubject(config.closeObserver);
      sockets.push(socket);
      return socket;
    });
    getToken = vi.fn().mockReturnValue(of('token'));

    TestBed.configureTestingModule({
      providers: [
        WsOrdersConnector,
        {provide: WEB_SOCKET_ORDERS_URL_PROVIDER, useValue: {cwsUrl: 'wss://test'}},
        {provide: ApiTokenProviderService, useValue: {getToken}},
        {provide: LoggerService, useValue: {info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn()}},
        {provide: RXJS_WEBSOCKET_CTOR, useValue: factory},
        {provide: ApplicationStatusService, useValue: {isActive: true, isActive$: of(true)}},
        {provide: DeviceNetworkService, useValue: {isOnline$: of(true)}}
      ]
    });

    service = TestBed.inject(WsOrdersConnector);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isOnline', () => {
    it('should report online before a connection has been opened', async () => {
      expect(await firstValueFrom(service.isOnline())).toBe(true);
    });
  });

  describe('submitCommand', () => {
    it('should authorize, send the command and return the correlated response', async () => {
      const response = await firstValueFrom(service.submitCommand({opcode: 'create:limit'}));

      expect(response.httpCode).toBe(200);
      expect(response.orderNumber).toBe('777');
      expect(factory).toHaveBeenCalledTimes(1);

      const sentCommand = currentSocket().outgoing.find(m => m.opcode === 'create:limit');
      expect(sentCommand?.guid).toBeDefined();
      expect(currentSocket().outgoing.some(m => m.opcode === 'authorize')).toBe(true);
    });

    it('should authorize the socket command channel with the current token', async () => {
      getToken.mockReturnValue(of('token-1'));

      await firstValueFrom(service.submitCommand({opcode: 'create:limit'}));

      const authorize = currentSocket().outgoing.find(m => m.opcode === 'authorize');
      expect(authorize).toMatchObject({
        opcode: 'authorize',
        token: 'token-1',
        originator: 'astras'
      });
    });

    it('should record the round-trip delay of a command', async () => {
      let delay: number | undefined;
      const sub = service.lastOrderDelayMs().subscribe(value => delay = value);

      await firstValueFrom(service.submitCommand({opcode: 'create:limit'}));
      sub.unsubscribe();

      expect(typeof delay).toBe('number');
    });

    it('should return a terminated response when the socket is not usable', async () => {
      service.warmUp();
      currentSocket().closed = true;

      const response = await firstValueFrom(service.submitCommand({opcode: 'create:limit'}));

      expect(response).toEqual({httpCode: -1, message: 'Connection is terminated', requestGuid: ''});
    });

    it('should reopen and authorize the command channel after socket close', async () => {
      getToken
        .mockReturnValueOnce(of('token-before-reconnect'))
        .mockReturnValueOnce(of('token-after-reconnect'));

      await firstValueFrom(service.submitCommand({opcode: 'create:limit'}));
      const firstSocket = currentSocket();
      expect(firstSocket.outgoing.find(m => m.opcode === 'authorize')?.token).toBe('token-before-reconnect');

      firstSocket.triggerClose();
      await vi.advanceTimersByTimeAsync(2000);

      expect(factory).toHaveBeenCalledTimes(2);

      await firstValueFrom(service.submitCommand({opcode: 'update:limit'}));
      const secondSocket = currentSocket();
      expect(secondSocket).not.toBe(firstSocket);
      expect(secondSocket.outgoing.find(m => m.opcode === 'authorize')?.token).toBe('token-after-reconnect');
      expect(secondSocket.outgoing.some(m => m.opcode === 'update:limit')).toBe(true);
    });
  });
});
