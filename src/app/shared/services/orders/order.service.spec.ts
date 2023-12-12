import { OrderService } from "./order.service";
import {
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import {
  of,
  throwError
} from "rxjs";
import { Side } from "../../models/enums/side.model";
import { toUnixTimestampSeconds } from "../../utils/datetime";
import { InstantNotificationsService } from '../instant-notifications.service';
import {LessMore} from "../../models/enums/less-more.model";
import {
  NewLimitOrder,
  NewMarketOrder, NewStopLimitOrder, NewStopMarketOrder,
  SubmitOrderResponse,
  SubmitOrderResult
} from "../../models/orders/new-order.model";
import {LimitOrderEdit, StopLimitOrderEdit, StopMarketOrderEdit} from "../../models/orders/edit-order.model";
import { EnvironmentService } from "../environment.service";


describe('OrderService', () => {
  let service: OrderService;

  let notificationServiceSpy: any;
  let errorHandlerServiceSpy: any;
  let httpSpy: any;

  const apiUrl = 'apiUrl';
  const baseApiUrl = apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders/actions';
  const defaultPortfolio = 'D1234';

  const isHeadersCorrect = (headers: { [header: string]: string | string[] | undefined }): boolean => {
    const hasRequestId = !!((headers['X-ALOR-REQID'])?.length ?? 0);
    const hasOriginator = headers['X-ALOR-ORIGINATOR'] === 'astras';

    return hasRequestId && hasOriginator;
  };

  beforeEach(() => {
    notificationServiceSpy = jasmine.createSpyObj('InstantNotificationsService', ['showNotification']);
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
          provide: InstantNotificationsService,
          useValue: notificationServiceSpy
        },
        {
          provide: ErrorHandlerService,
          useValue: errorHandlerServiceSpy
        },
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl
          }
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
    const submitOrder = (order: NewMarketOrder, onResult?: (result: SubmitOrderResult) => void): void => {
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

      submitOrder({} as NewMarketOrder);
    });

    it('should send correct headers', (done) => {
      httpSpy.post.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder({} as NewMarketOrder);
    });

    it('all parameters should be provided', (done) => {
      const order: NewMarketOrder = {
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
        {} as NewMarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
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
        {} as NewMarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
    });

    it('should handle common error', (done) => {
      httpSpy.post.and.returnValue(throwError(() => Error()));

      submitOrder(
        {} as NewMarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(errorHandlerServiceSpy.handleError).toHaveBeenCalled();
    });
  });

  describe('#submitLimitOrder', () => {
    const submitOrder = (order: NewLimitOrder, onResult?: (result: SubmitOrderResult) => void): void => {
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

      submitOrder({} as NewLimitOrder);
    });

    it('should send correct headers', (done) => {
      httpSpy.post.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: '1' } as SubmitOrderResponse);
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

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder(order);
    });

    it('should notify about success', (done) => {
      httpSpy.post.and.returnValue(of({ orderNumber: '1' } as SubmitOrderResponse));

      submitOrder(
        {} as NewLimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
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

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
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

  describe('#submitStopMarketOrder', () => {
    const submitOrder = (order: NewStopMarketOrder, onResult?: (result: SubmitOrderResult) => void): void => {
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

      submitOrder({} as NewStopMarketOrder);
    });

    it('should send correct headers', (done) => {
      httpSpy.post.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder({} as NewStopMarketOrder);
    });

    it('all parameters should be provided', (done) => {
      const order: NewStopMarketOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        condition: LessMore.Less,
        triggerPrice: 50,
        stopEndUnixTime: new Date()
      } as NewStopMarketOrder;

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
        {} as NewStopMarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
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
        {} as NewStopMarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
    });

    it('should handle common error', (done) => {
      httpSpy.post.and.returnValue(throwError(() => Error()));

      submitOrder(
        {} as NewStopMarketOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();
        }
      );

      expect(errorHandlerServiceSpy.handleError).toHaveBeenCalled();
    });
  });

  describe('#submitStopLimitOrder', () => {
    const submitOrder = (order: NewStopLimitOrder, onResult?: (result: SubmitOrderResult) => void): void => {
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

      submitOrder({} as NewStopLimitOrder);
    });

    it('should send correct headers', (done) => {
      httpSpy.post.and.callFake((url: string, body: any, options: any) => {
        done();

        expect(isHeadersCorrect(options.headers)).toBeTrue();

        return of({ orderNumber: '1' } as SubmitOrderResponse);
      });

      submitOrder({} as NewStopLimitOrder);
    });

    it('all parameters should be provided', (done) => {
      const order: NewStopLimitOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        condition: LessMore.Less,
        triggerPrice: 50,
        stopEndUnixTime: new Date(),
        price: 100
      } as NewStopLimitOrder;

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
        {} as NewStopLimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
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
        {} as NewStopLimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();

        }
      );

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
    });

    it('should handle common error', (done) => {
      httpSpy.post.and.returnValue(throwError(() => Error()));

      submitOrder(
        {} as NewStopLimitOrder,
        result => {
          done();

          expect(result.isSuccess).toBeFalse();

        }
      );

      expect(errorHandlerServiceSpy.handleError).toHaveBeenCalled();
    });
  });

  describe('#submitLimitOrderEdit', () => {
    const submitOrder = (order: LimitOrderEdit, onResult?: (result: SubmitOrderResult) => void): void => {
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

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
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

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
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
    const submitOrder = (order: StopMarketOrderEdit, onResult?: (result: SubmitOrderResult) => void): void => {
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
      const orderStopTime = new Date();
      const order: StopMarketOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        id: '123',
        condition: LessMore.Less,
        triggerPrice: 100,
        side: Side.Buy,
        stopEndUnixTime:orderStopTime
      };

      httpSpy.put.and.callFake((url: string, body: any) => {
        done();

        expect(body.user.portfolio).toBe(defaultPortfolio);
        expect(body.instrument.symbol).toBe(order.instrument.symbol);
        expect(body.instrument.exchange).toBe(order.instrument.exchange);
        expect(body.quantity).toBe(order.quantity);
        expect(body.side).toBe(order.side);
        expect(body.condition).toBe(order.condition);
        expect(body.triggerPrice).toBe(order.triggerPrice);
        expect(body.stopEndUnixTime).toBe(toUnixTimestampSeconds(orderStopTime));

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

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
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

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
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
    const submitOrder = (order: StopLimitOrderEdit, onResult?: (result: SubmitOrderResult) => void): void => {
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
      const orderStopTime = new Date();

      const order: StopLimitOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        id: '123',
        condition: LessMore.Less,
        triggerPrice: 100,
        price: 100,
        side: Side.Buy,
        stopEndUnixTime: orderStopTime
      };

      httpSpy.put.and.callFake((url: string, body: any) => {
        done();

        expect(body.user.portfolio).toBe(defaultPortfolio);
        expect(body.instrument.symbol).toBe(order.instrument.symbol);
        expect(body.instrument.exchange).toBe(order.instrument.exchange);
        expect(body.quantity).toBe(order.quantity);
        expect(body.side).toBe(order.side);
        expect(body.condition).toBe(order.condition);
        expect(body.triggerPrice).toBe(order.triggerPrice);
        expect(body.stopEndUnixTime).toBe(toUnixTimestampSeconds(orderStopTime));
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

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
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

      expect(notificationServiceSpy.showNotification).toHaveBeenCalled();
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
