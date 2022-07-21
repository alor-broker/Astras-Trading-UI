import { TestBed } from '@angular/core/testing';

import { OrderService } from './order.service';
import {
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { sharedModuleImportForTests } from "../utils/testing";
import { Store } from "@ngrx/store";
import { selectNewPortfolio } from "../../store/portfolios/portfolios.actions";
import { PortfolioKey } from "../models/portfolio-key.model";
import {
  LimitOrder,
  MarketOrder,
  StopLimitOrder,
  StopMarketOrder,
  SubmitOrderResponse,
  SubmitOrderResult
} from "../../modules/command/models/order.model";
import { environment } from "../../../environments/environment";
import { of } from "rxjs";
import { Side } from "../models/enums/side.model";
import { StopOrderCondition } from "../models/enums/stoporder-conditions";
import { toUnixTimestampSeconds } from "../utils/datetime";

describe('OrderService', () => {
  let service: OrderService;
  let store: Store;

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
    httpSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);

    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
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
    store = TestBed.inject(Store);
  });

  beforeEach(() => {
    store.dispatch(selectNewPortfolio({
        portfolio: { portfolio: defaultPortfolio } as PortfolioKey
      })
    );
  });


  describe('Common checks', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('#submitMarketOrder', () => {
    const submitOrder = (order: MarketOrder, onResult?: (result: SubmitOrderResult) => void) => {
      service.submitMarketOrder(order)
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

        expect(isHeadersCorrect(options.headers)).toBeTruthy();

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
      httpSpy.post.and.callFake(() => {
        throw new HttpErrorResponse({
          error: {
            code: 'CODE',
            message: 'Message'
          }
        });
      });

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
      httpSpy.post.and.callFake(() => {
        throw new Error();
      });

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
      service.submitLimitOrder(order)
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

        expect(isHeadersCorrect(options.headers)).toBeTruthy();

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
      httpSpy.post.and.callFake(() => {
        throw new HttpErrorResponse({
          error: {
            code: 'CODE',
            message: 'Message'
          }
        });
      });

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
      httpSpy.post.and.callFake(() => {
        throw new Error();
      });

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
      service.submitStopMarketOrder(order)
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

        expect(isHeadersCorrect(options.headers)).toBeTruthy();

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
      httpSpy.post.and.callFake(() => {
        throw new HttpErrorResponse({
          error: {
            code: 'CODE',
            message: 'Message'
          }
        });
      });

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
      httpSpy.post.and.callFake(() => {
        throw new Error();
      });

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
      service.submitStopLimitOrder(order)
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

        expect(isHeadersCorrect(options.headers)).toBeTruthy();

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
      httpSpy.post.and.callFake(() => {
        throw new HttpErrorResponse({
          error: {
            code: 'CODE',
            message: 'Message'
          }
        });
      });

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
      httpSpy.post.and.callFake(() => {
        throw new Error();
      });

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
});
