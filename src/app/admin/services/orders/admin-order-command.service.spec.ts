import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import {
  AdminOrderCommandService,
  OrderCommandResponse
} from './admin-order-command.service';
import { EnvironmentService } from "../../../shared/services/environment.service";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { OrderInstantTranslatableNotificationsService } from "../../../shared/services/orders/order-instant-translatable-notifications.service";
import {
  HttpClient,
  HttpErrorResponse,
} from "@angular/common/http";
import {
  NewLimitOrder,
  OrderCommandResult
} from "../../../shared/models/orders/new-order.model";
import { SubmitGroupResult } from "../../../shared/models/orders/orders-group.model";
import {
  of,
  take,
  throwError
} from "rxjs";
import { Side } from "../../../shared/models/enums/side.model";
import { OrderType } from "../../../shared/models/orders/order.model";

describe('AdminOrderCommandService', () => {
  let service: AdminOrderCommandService;

  let notificationServiceSpy: any;
  let errorHandlerServiceSpy: any;
  let httpSpy: any;

  const apiUrl = 'apiUrl';
  const baseApiUrl = apiUrl + '/commandapi/api/v2/admin/orders';
  const defaultPortfolio = 'D1234';

  const isHeadersCorrect = (headers: Record<string, string | string[] | undefined>): boolean => {
    const hasRequestId = !!((headers['X-ALOR-REQID'])?.length ?? 0);
    const hasOriginator = headers['X-ALOR-ORIGINATOR'] === 'astras';

    return hasRequestId && hasOriginator;
  };

  beforeEach(() => {
    notificationServiceSpy = jasmine.createSpyObj('OrderInstantTranslatableNotificationsService', [
      'orderSubmitFailed',
      'orderCreated',
      'orderUpdateFailed',
      'orderUpdated',
      'orderCancelled',
      'orderCancelFailed',
    ]);

    errorHandlerServiceSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
    httpSpy = jasmine.createSpyObj<HttpClient>(
      'HttpClient',
      [
        'post',
        'put',
        'request'
      ]);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminOrderCommandService,
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: errorHandlerServiceSpy
        },
        {
          provide: OrderInstantTranslatableNotificationsService,
          useValue: notificationServiceSpy
        },
        {
          provide: HttpClient,
          useValue: httpSpy
        }
      ]
    });
    service = TestBed.inject(AdminOrderCommandService);
  });

  describe('Common checks', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('#submitMarketOrder', () => {
    const submitOrder = (onResult?: (result: OrderCommandResult) => void): void => {
      service.submitMarketOrder()
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('unsupported error should be risen', (done) => {
      submitOrder(result => {
        done();
        expect(result.isSuccess).toBeFalse();
        expect(notificationServiceSpy.orderSubmitFailed).toHaveBeenCalled();
      });
    });
  });

  describe('#submitStopMarketOrder', () => {
    const submitOrder = (onResult?: (result: OrderCommandResult) => void): void => {
      service.submitStopMarketOrder()
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('unsupported error should be risen', (done) => {
      submitOrder(result => {
        done();
        expect(result.isSuccess).toBeFalse();
        expect(notificationServiceSpy.orderSubmitFailed).toHaveBeenCalled();
      });
    });
  });

  describe('#submitStopLimitOrder', () => {
    const submitOrder = (onResult?: (result: OrderCommandResult) => void): void => {
      service.submitStopLimitOrder()
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('unsupported error should be risen', (done) => {
      submitOrder(result => {
        done();
        expect(result.isSuccess).toBeFalse();
        expect(notificationServiceSpy.orderSubmitFailed).toHaveBeenCalled();
      });
    });
  });

  describe('#submitStopMarketOrderEdit', () => {
    const submitOrder = (onResult?: (result: OrderCommandResult) => void): void => {
      service.submitStopMarketOrderEdit()
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('unsupported error should be risen', (done) => {
      submitOrder(result => {
        done();
        expect(result.isSuccess).toBeFalse();
        expect(notificationServiceSpy.orderUpdateFailed).toHaveBeenCalled();
      });
    });
  });

  describe('#submitStopLimitOrderEdit', () => {
    const submitOrder = (onResult?: (result: OrderCommandResult) => void): void => {
      service.submitStopLimitOrderEdit()
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('unsupported error should be risen', (done) => {
      submitOrder(result => {
        done();
        expect(result.isSuccess).toBeFalse();
        expect(notificationServiceSpy.orderUpdateFailed).toHaveBeenCalled();
      });
    });
  });

  describe('#submitOrdersGroup', () => {
    const submitCommand = (onResult?: (result: SubmitGroupResult | null) => void): void => {
      service.submitOrdersGroup()
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('should return empty result', (done) => {
      submitCommand(result => {
        done();
        expect(result).toBeNull();
      });
    });
  });

  describe('#submitLimitOrder', () => {
    const submitOrder = (order: NewLimitOrder, onResult?: (result: OrderCommandResult) => void): void => {
      service.submitLimitOrder(order, defaultPortfolio).pipe(
        take(1)
      ).subscribe((result) => {
        if (onResult) {
          onResult(result);
        }
      });
    };

    it('correct url should be used', (done) => {
      httpSpy.post.and.callFake((url: string) => {
        done();

        expect(url).toBe(`${baseApiUrl}/actions/limit`);

        return of({ orderNumber: '1' } as OrderCommandResponse);
      });

      submitOrder({} as NewLimitOrder);
    });

    it('should send correct headers', (done) => {
      httpSpy.post.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: '1' } as OrderCommandResponse);
      });

      submitOrder({} as NewLimitOrder);
    });

    it('all parameters should be provided', (done) => {
      const order: NewLimitOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        price: 100
      };

      httpSpy.post.and.callFake((url: string, body: any) => {
        done();

        expect(body.user.portfolio).toBe(defaultPortfolio);
        expect(body.instrument.symbol).toBe(order.instrument.symbol);
        expect(body.instrument.exchange).toBe(order.instrument.exchange);
        expect(body.side).toBe(order.side);
        expect(body.quantity).toBe(order.quantity);
        expect(body.price).toBe(order.price);

        return of({ orderNumber: '1' } as OrderCommandResponse);
      });

      submitOrder(order);
    });

    it('should notify about success', (done) => {
      httpSpy.post.and.returnValue(of({ orderNumber: '1' } as OrderCommandResponse));

      submitOrder(
        {} as NewLimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.orderCreated).toHaveBeenCalled();
    });

    it('should notify about http error', (done) => {
      httpSpy.post.and.returnValue(
        throwError(() => new HttpErrorResponse({
            error: {
              code: 'CODE',
              message: 'Message'
            }
          })
        )
      );

      submitOrder(
        {} as NewLimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(notificationServiceSpy.orderSubmitFailed).toHaveBeenCalled();
    });

    it('should handle common error', (done) => {
      httpSpy.post.and.returnValue(throwError(() => Error()));

      submitOrder(
        {} as NewLimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(errorHandlerServiceSpy.handleError).toHaveBeenCalled();
    });
  });

  describe('#cancelOrders', () => {
    it('correct url should be used', (done) => {
      const request = {
        orderId: '123',
        portfolio: defaultPortfolio,
        exchange: 'MOEX',
        orderType: OrderType.Limit
      };

      httpSpy.request.and.callFake((method: string, url: string) => {
        done();

        expect(method).toBe('DELETE');
        expect(url).toBe(`${baseApiUrl}/${request.orderId}`);

        return of({ orderNumber: request.orderId } as OrderCommandResponse);
      });

      service.cancelOrders([request]).subscribe();
    });

    it('should notify about unsupported order type', fakeAsync(() => {
        const request = {
          orderId: '123',
          portfolio: defaultPortfolio,
          exchange: 'MOEX',
          orderType: OrderType.Market
        };

        service.cancelOrders([request]).subscribe();

        tick();
        expect(notificationServiceSpy.orderCancelFailed).toHaveBeenCalled();
      })
    );

    it('should notify about success', fakeAsync(() => {
        const request = {
          orderId: '123',
          portfolio: defaultPortfolio,
          exchange: 'MOEX',
          orderType: OrderType.Limit
        };

        httpSpy.request.and.returnValue(of({
          isSuccess: true,
          message: '',
          orderNumber: request.orderId
        }));

        service.cancelOrders([request]).subscribe();

        tick();
        expect(notificationServiceSpy.orderCancelled).toHaveBeenCalled();
      })
    );

    it('should notify about error', fakeAsync(() => {
      const request = {
        orderId: '123',
        portfolio: defaultPortfolio,
        exchange: 'MOEX',
        orderType: OrderType.Limit
      };

      httpSpy.request.and.returnValue(of(null));

      service.cancelOrders([request]).subscribe();

      tick();
      expect(notificationServiceSpy.orderCancelFailed).toHaveBeenCalled();
    }));
  });
});
