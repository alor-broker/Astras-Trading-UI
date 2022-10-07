import { OrderService } from "./order.service";
import { environment } from "../../../../environments/environment";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import {
  LimitOrder,
  LimitOrderEdit,
  MarketOrder,
  StopLimitOrder,
  StopLimitOrderEdit,
  StopMarketOrder,
  StopMarketOrderEdit,
  SubmitOrderResponse,
  SubmitOrderResult
} from "../../../modules/command/models/order.model";
import { of, throwError } from "rxjs";
import { Side } from "../../models/enums/side.model";
import { StopOrderCondition } from "../../models/enums/stoporder-conditions";
import { toUnixTimestampSeconds } from "../../utils/datetime";
import { instrumentsBadges } from "../../utils/instruments";


describe('OrderService', () => {
  let service: OrderService;

  let notificationServiceSpy: any;
  let errorHandlerServiceSpy: any;
  let httpSpy: any;

  const baseApiUrl = environment.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders/actions';
  const defaultPortfolio = 'D1234';

  const isHeadersCorrect = (headers: { [header: string]: string | string[] }) => {
    const hasRequestId = !!headers['X-ALOR-REQID'];
    const hasOriginator = headers['X-ALOR-ORIGINATOR'] === 'astras';

    return hasRequestId && hasOriginator;
  };

  beforeEach(() => {
    notificationServiceSpy = jasmine.createSpyObj('NzNotificationService', ['success', 'error']);
    errorHandlerServiceSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
    httpSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['post', 'put']);

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        {
          provide: HttpClient,
          useValue: httpSpy
        },
        {
          provide: NzNotificationService,
          useValue: notificationServiceSpy
        },
        {
          provide: ErrorHandlerService,
          useValue: errorHandlerServiceSpy
        }
      ]
    });

    service = TestBed.inject(OrderService);
  });


  describe('Common checks', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('#submitMarketOrder', () => {
    const submitOrder = (order: MarketOrder, onResult?: (result: SubmitOrderResult) => void) => {
      service.submitMarketOrder(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('correct url should be used', (done) => {
      httpSpy.post.and.callFake((url: string) => {
        done();

        expect(url).toBe(`${baseApiUrl}/market`);

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder({} as MarketOrder);
    });

    it('should send correct headers', (done) => {
      httpSpy.post.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder({} as MarketOrder);
    });

    it('all parameters should be provided', (done) => {
      const order: MarketOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100
      };

      httpSpy.post.and.callFake((url: string, body: any) => {
        done();

        expect(body.user.portfolio).toBe(defaultPortfolio);
        expect(body.instrument.symbol).toBe(order.instrument.symbol);
        expect(body.instrument.exchange).toBe(order.instrument.exchange);
        expect(body.side).toBe(order.side);
        expect(body.quantity).toBe(order.quantity);

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('should notify about success', (done) => {
      httpSpy.post.and.returnValue(of({ orderNumber: '1' } as SubmitOrderResponse));

      submitOrder(
        {} as MarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.success).toHaveBeenCalled();
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
        {} as MarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(notificationServiceSpy.error).toHaveBeenCalled();
    });

    it('should handle common error', (done) => {
      httpSpy.post.and.returnValue(throwError(() => Error()));

      submitOrder(
        {} as MarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(errorHandlerServiceSpy.handleError).toHaveBeenCalled();
    });
  });

  describe('#submitLimitOrder', () => {
    const submitOrder = (order: LimitOrder, onResult?: (result: SubmitOrderResult) => void) => {
      service.submitLimitOrder(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('correct url should be used', (done) => {
      httpSpy.post.and.callFake((url: string) => {
        done();

        expect(url).toBe(`${baseApiUrl}/limit`);

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder({} as LimitOrder);
    });

    it('should send correct headers', (done) => {
      httpSpy.post.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder({} as LimitOrder);
    });

    it('all parameters should be provided', (done) => {
      const order: LimitOrder = {
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

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('should notify about success', (done) => {
      httpSpy.post.and.returnValue(of({ orderNumber: '1' } as SubmitOrderResponse));

      submitOrder(
        {} as LimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.success).toHaveBeenCalled();
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
        {} as LimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(notificationServiceSpy.error).toHaveBeenCalled();
    });

    it('should handle common error', (done) => {
      httpSpy.post.and.returnValue(throwError(() => Error()));

      submitOrder(
        {} as LimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(errorHandlerServiceSpy.handleError).toHaveBeenCalled();
    });
  });

  describe('#submitStopMarketOrder', () => {
    const submitOrder = (order: StopMarketOrder, onResult?: (result: SubmitOrderResult) => void) => {
      service.submitStopMarketOrder(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('correct url should be used', (done) => {
      httpSpy.post.and.callFake((url: string) => {
        done();

        expect(url).toBe(`${baseApiUrl}/stop`);

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder({} as StopMarketOrder);
    });

    it('should send correct headers', (done) => {
      httpSpy.post.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder({} as StopMarketOrder);
    });

    it('all parameters should be provided', (done) => {
      const order: StopMarketOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        condition: StopOrderCondition.Less,
        triggerPrice: 50,
        stopEndUnixTime: new Date()
      };

      httpSpy.post.and.callFake((url: string, body: any) => {
        done();

        expect(body.user.portfolio).toBe(defaultPortfolio);
        expect(body.instrument.symbol).toBe(order.instrument.symbol);
        expect(body.instrument.exchange).toBe(order.instrument.exchange);
        expect(body.side).toBe(order.side);
        expect(body.quantity).toBe(order.quantity);
        expect(body.condition).toBe(order.condition);
        expect(body.triggerPrice).toBe(order.triggerPrice);
        expect(body.stopEndUnixTime).toBe(toUnixTimestampSeconds(order.stopEndUnixTime as Date));

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('should notify about success', (done) => {
      httpSpy.post.and.returnValue(of({ orderNumber: '1' } as SubmitOrderResponse));

      submitOrder(
        {} as StopMarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.success).toHaveBeenCalled();
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
        {} as StopMarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(notificationServiceSpy.error).toHaveBeenCalled();
    });

    it('should handle common error', (done) => {
      httpSpy.post.and.returnValue(throwError(() => Error()));

      submitOrder(
        {} as StopMarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(errorHandlerServiceSpy.handleError).toHaveBeenCalled();
    });
  });

  describe('#submitStopLimitOrder', () => {
    const submitOrder = (order: StopLimitOrder, onResult?: (result: SubmitOrderResult) => void) => {
      service.submitStopLimitOrder(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('correct url should be used', (done) => {
      httpSpy.post.and.callFake((url: string) => {
        done();

        expect(url).toBe(`${baseApiUrl}/stopLimit`);

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder({} as StopLimitOrder);
    });

    it('should send correct headers', (done) => {
      httpSpy.post.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder({} as StopLimitOrder);
    });

    it('all parameters should be provided', (done) => {
      const order: StopLimitOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        condition: StopOrderCondition.Less,
        triggerPrice: 50,
        stopEndUnixTime: new Date(),
        price: 100
      };

      httpSpy.post.and.callFake((url: string, body: any) => {
        done();

        expect(body.user.portfolio).toBe(defaultPortfolio);
        expect(body.instrument.symbol).toBe(order.instrument.symbol);
        expect(body.instrument.exchange).toBe(order.instrument.exchange);
        expect(body.side).toBe(order.side);
        expect(body.quantity).toBe(order.quantity);
        expect(body.condition).toBe(order.condition);
        expect(body.triggerPrice).toBe(order.triggerPrice);
        expect(body.stopEndUnixTime).toBe(toUnixTimestampSeconds(order.stopEndUnixTime as Date));
        expect(body.price).toBe(order.price);

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('should notify about success', (done) => {
      httpSpy.post.and.returnValue(of({ orderNumber: '1' } as SubmitOrderResponse));

      submitOrder(
        {} as StopLimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.success).toHaveBeenCalled();
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
        {} as StopLimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();

        }
      );

      expect(notificationServiceSpy.error).toHaveBeenCalled();
    });

    it('should handle common error', (done) => {
      httpSpy.post.and.returnValue(throwError(() => Error()));

      submitOrder(
        {} as StopLimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();

        }
      );

      expect(errorHandlerServiceSpy.handleError).toHaveBeenCalled();
    });
  });

  describe('#submitLimitOrderEdit', () => {
    const submitOrder = (order: LimitOrderEdit, onResult?: (result: SubmitOrderResult) => void) => {
      service.submitLimitOrderEdit(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('correct url should be used', (done) => {
      const order = {
        id: '123'
      } as LimitOrderEdit;

      httpSpy.put.and.callFake((url: string) => {
        done();

        expect(url).toBe(`${baseApiUrl}/limit/${order.id}`);

        return of({ orderNumber: order.id } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('should send correct headers', (done) => {
      const order = {
        id: '123'
      } as LimitOrderEdit;

      httpSpy.put.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: order.id } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('all parameters should be provided', (done) => {
      const order: LimitOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        price: 100,
        id: '123'
      };

      httpSpy.put.and.callFake((url: string, body: any) => {
        done();

        expect(body.user.portfolio).toBe(defaultPortfolio);
        expect(body.instrument.symbol).toBe(order.instrument.symbol);
        expect(body.instrument.exchange).toBe(order.instrument.exchange);
        expect(body.quantity).toBe(order.quantity);
        expect(body.price).toBe(order.price);

        return of({ orderNumber: order.id } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('should notify about success', (done) => {
      httpSpy.put.and.returnValue(of({ orderNumber: '123' } as SubmitOrderResponse));

      submitOrder(
        {} as LimitOrderEdit,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.success).toHaveBeenCalled();
    });

    it('should notify about http error', (done) => {
      httpSpy.put.and.returnValue(
        throwError(() => new HttpErrorResponse({
            error: {
              code: 'CODE',
              message: 'Message'
            }
          })
        )
      );

      submitOrder(
        {} as LimitOrderEdit,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(notificationServiceSpy.error).toHaveBeenCalled();
    });

    it('should handle common error', (done) => {
      httpSpy.put.and.returnValue(throwError(() => Error()));

      submitOrder(
        {} as LimitOrderEdit,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(errorHandlerServiceSpy.handleError).toHaveBeenCalled();
    });
  });

  describe('#submitStopMarketOrderEdit', () => {
    const submitOrder = (order: StopMarketOrderEdit, onResult?: (result: SubmitOrderResult) => void) => {
      service.submitStopMarketOrderEdit(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('correct url should be used', (done) => {
      const order = {
        id: '123'
      } as StopMarketOrderEdit;

      httpSpy.put.and.callFake((url: string) => {
        done();

        expect(url).toBe(`${baseApiUrl}/stop/${order.id}`);

        return of({ orderNumber: order.id } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('should send correct headers', (done) => {
      const order = {
        id: '123'
      } as StopMarketOrderEdit;

      httpSpy.put.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: order.id } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('all parameters should be provided', (done) => {
      const order: StopMarketOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        id: '123',
        conditionType: StopOrderCondition.Less,
        triggerPrice: 100,
        side: Side.Buy,
        endTime: 123
      };

      httpSpy.put.and.callFake((url: string, body: any) => {
        done();

        expect(body.user.portfolio).toBe(defaultPortfolio);
        expect(body.instrument.symbol).toBe(order.instrument.symbol);
        expect(body.instrument.exchange).toBe(order.instrument.exchange);
        expect(body.quantity).toBe(order.quantity);
        expect(body.side).toBe(order.side);
        expect(body.conditionType).toBe(order.conditionType);
        expect(body.triggerPrice).toBe(order.triggerPrice);
        expect(body.endTime).toBe(order.endTime);

        return of({ orderNumber: order.id } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('should notify about success', (done) => {
      httpSpy.put.and.returnValue(of({ orderNumber: '123' } as SubmitOrderResponse));

      submitOrder(
        {} as StopMarketOrderEdit,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.success).toHaveBeenCalled();
    });

    it('should notify about http error', (done) => {
      httpSpy.put.and.returnValue(
        throwError(() => new HttpErrorResponse({
            error: {
              code: 'CODE',
              message: 'Message'
            }
          })
        )
      );

      submitOrder(
        {} as StopMarketOrderEdit,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(notificationServiceSpy.error).toHaveBeenCalled();
    });

    it('should handle common error', (done) => {
      httpSpy.put.and.returnValue(throwError(() => Error()));

      submitOrder(
        {} as StopMarketOrderEdit,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(errorHandlerServiceSpy.handleError).toHaveBeenCalled();
    });
  });

  describe('#submitStopLimitOrderEdit', () => {
    const submitOrder = (order: StopLimitOrderEdit, onResult?: (result: SubmitOrderResult) => void) => {
      service.submitStopLimitOrderEdit(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('correct url should be used', (done) => {
      const order = {
        id: '123'
      } as StopLimitOrderEdit;

      httpSpy.put.and.callFake((url: string) => {
        done();

        expect(url).toBe(`${baseApiUrl}/stopLimit/${order.id}`);

        return of({ orderNumber: order.id } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('should send correct headers', (done) => {
      const order = {
        id: '123'
      } as StopLimitOrderEdit;

      httpSpy.put.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: order.id } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('all parameters should be provided', (done) => {
      const order: StopLimitOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        id: '123',
        conditionType: StopOrderCondition.Less,
        triggerPrice: 100,
        price: 100,
        side: Side.Buy,
        endTime: 123
      };

      httpSpy.put.and.callFake((url: string, body: any) => {
        done();

        expect(body.user.portfolio).toBe(defaultPortfolio);
        expect(body.instrument.symbol).toBe(order.instrument.symbol);
        expect(body.instrument.exchange).toBe(order.instrument.exchange);
        expect(body.quantity).toBe(order.quantity);
        expect(body.side).toBe(order.side);
        expect(body.conditionType).toBe(order.conditionType);
        expect(body.triggerPrice).toBe(order.triggerPrice);
        expect(body.endTime).toBe(order.endTime);
        expect(body.price).toBe(order.price);

        return of({ orderNumber: order.id } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('should notify about success', (done) => {
      httpSpy.put.and.returnValue(of({ orderNumber: '123' } as SubmitOrderResponse));

      submitOrder(
        {} as StopLimitOrderEdit,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.success).toHaveBeenCalled();
    });

    it('should notify about http error', (done) => {
      httpSpy.put.and.returnValue(
        throwError(() => new HttpErrorResponse({
            error: {
              code: 'CODE',
              message: 'Message'
            }
          })
        )
      );

      submitOrder(
        {} as StopLimitOrderEdit,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(notificationServiceSpy.error).toHaveBeenCalled();
    });

    it('should handle common error', (done) => {
      httpSpy.put.and.returnValue(throwError(() => Error()));

      submitOrder(
        {} as StopLimitOrderEdit,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(errorHandlerServiceSpy.handleError).toHaveBeenCalled();
    });
  });
});
