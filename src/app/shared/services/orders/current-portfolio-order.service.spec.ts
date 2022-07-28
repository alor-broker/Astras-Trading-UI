import { TestBed } from '@angular/core/testing';

import { CurrentPortfolioOrderService } from './current-portfolio-order.service';
import { Store } from "@ngrx/store";
import { OrderService } from "./order.service";
import { sharedModuleImportForTests } from "../../utils/testing";
import { selectNewPortfolio } from "../../../store/portfolios/portfolios.actions";
import { PortfolioKey } from "../../models/portfolio-key.model";
import {
  LimitOrder,
  LimitOrderEdit,
  MarketOrder,
  StopLimitOrder,
  StopMarketOrder,
  SubmitOrderResult
} from "../../../modules/command/models/order.model";
import { Side } from "../../models/enums/side.model";
import { of } from "rxjs";
import { StopOrderCondition } from "../../models/enums/stoporder-conditions";

describe('CurrentPortfolioOrderService', () => {
  let service: CurrentPortfolioOrderService;

  let orderServiceSpy: any;
  let store: Store;

  const defaultPortfolio = 'D1234';

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj(
      'OrderService',
      [
        'submitMarketOrder',
        'submitLimitOrder',
        'submitStopMarketOrder',
        'submitStopLimitOrder',
        'submitLimitOrderEdit'
      ]
    );

    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        {
          provide: OrderService,
          useValue: orderServiceSpy
        },
      ]
    });
    service = TestBed.inject(CurrentPortfolioOrderService);

    store = TestBed.inject(Store);
  });

  beforeEach(() => {
    store.dispatch(selectNewPortfolio({ portfolio: { portfolio: defaultPortfolio } as PortfolioKey }));
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

    it('correct parameters should be passed', (done) => {
      const order: LimitOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        price: 100
      };

      orderServiceSpy.submitMarketOrder.and.callFake((passedOrder: LimitOrder, portfolio: string) => {
        done();

        expect(portfolio).toEqual(defaultPortfolio);
        expect(order).toEqual(passedOrder);

        return of({ orderNumber: '123' } as SubmitOrderResult);
      });

      submitOrder(order);
    });

    it('correct success result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: true,
        orderNumber: '123'
      };

      orderServiceSpy.submitMarketOrder.and.returnValue(of(expectedResult));

      submitOrder(
        {} as MarketOrder,
        result => {
          done();

          expect(result).toEqual(expectedResult);
        });
    });

    it('correct failed result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      orderServiceSpy.submitMarketOrder.and.returnValue(of(expectedResult));

      submitOrder(
        {} as MarketOrder,
        result => {
          done();

          expect(result).toEqual(expectedResult);
        });
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

    it('correct parameters should be passed', (done) => {
      const order: LimitOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        price: 150
      };

      orderServiceSpy.submitLimitOrder.and.callFake((passedOrder: LimitOrder, portfolio: string) => {
        done();

        expect(portfolio).toEqual(defaultPortfolio);
        expect(order).toEqual(passedOrder);

        return of({ orderNumber: '123' } as SubmitOrderResult);
      });

      submitOrder(order);
    });

    it('correct success result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: true,
        orderNumber: '123'
      };

      orderServiceSpy.submitLimitOrder.and.returnValue(of(expectedResult));

      submitOrder(
        {} as LimitOrder,
        result => {
          done();

          expect(result).toEqual(expectedResult);
        });
    });

    it('correct failed result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      orderServiceSpy.submitLimitOrder.and.returnValue(of(expectedResult));

      submitOrder(
        {} as LimitOrder,
        result => {
          done();

          expect(result).toEqual(expectedResult);
        });
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

    it('correct parameters should be passed', (done) => {
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

      orderServiceSpy.submitStopMarketOrder.and.callFake((passedOrder: StopMarketOrder, portfolio: string) => {
        done();

        expect(portfolio).toEqual(defaultPortfolio);
        expect(order).toEqual(passedOrder);

        return of({ orderNumber: '123' } as SubmitOrderResult);
      });

      submitOrder(order);
    });

    it('correct success result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: true,
        orderNumber: '123'
      };

      orderServiceSpy.submitStopMarketOrder.and.returnValue(of(expectedResult));

      submitOrder(
        {} as StopMarketOrder,
        result => {
          done();

          expect(result).toEqual(expectedResult);
        });
    });

    it('correct failed result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      orderServiceSpy.submitStopMarketOrder.and.returnValue(of(expectedResult));

      submitOrder(
        {} as StopMarketOrder,
        result => {
          done();

          expect(result).toEqual(expectedResult);
        });
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

    it('correct parameters should be passed', (done) => {
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

      orderServiceSpy.submitStopLimitOrder.and.callFake((passedOrder: StopLimitOrder, portfolio: string) => {
        done();

        expect(portfolio).toEqual(defaultPortfolio);
        expect(order).toEqual(passedOrder);

        return of({ orderNumber: '123' } as SubmitOrderResult);
      });

      submitOrder(order);
    });

    it('correct success result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: true,
        orderNumber: '123'
      };

      orderServiceSpy.submitStopLimitOrder.and.returnValue(of(expectedResult));

      submitOrder(
        {} as StopLimitOrder,
        result => {
          done();

          expect(result).toEqual(expectedResult);
        });
    });

    it('correct failed result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      orderServiceSpy.submitStopLimitOrder.and.returnValue(of(expectedResult));

      submitOrder(
        {} as StopLimitOrder,
        result => {
          done();

          expect(result).toEqual(expectedResult);
        });
    });
  });

  describe('#submitLimitOrderEdit', () => {
    const submitOrder = (order: LimitOrderEdit, onResult?: (result: SubmitOrderResult) => void) => {
      service.submitLimitOrderEdit(order)
      .subscribe((result) => {
        if (onResult) {
          onResult(result);
        }
      });
    };

    it('correct parameters should be passed', (done) => {
      const order: LimitOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        price: 100,
        id: '123'
      };

      orderServiceSpy.submitLimitOrderEdit.and.callFake((passedOrder: LimitOrderEdit, portfolio: string) => {
        done();

        expect(portfolio).toEqual(defaultPortfolio);
        expect(order).toEqual(passedOrder);

        return of({ orderNumber: '123' } as SubmitOrderResult);
      });

      submitOrder(order);
    });

    it('correct success result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: true,
        orderNumber: '123'
      };

      orderServiceSpy.submitLimitOrderEdit.and.returnValue(of(expectedResult));

      submitOrder(
        {} as LimitOrderEdit,
        result => {
          done();

          expect(result).toEqual(expectedResult);
        });
    });

    it('correct failed result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      orderServiceSpy.submitLimitOrderEdit.and.returnValue(of(expectedResult));

      submitOrder(
        {} as LimitOrderEdit,
        result => {
          done();

          expect(result).toEqual(expectedResult);
        });
    });
  });
});
