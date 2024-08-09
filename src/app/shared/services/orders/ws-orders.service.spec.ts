import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import { WsOrdersService } from './ws-orders.service';
import {
  CommandResponse,
  WsOrdersConnector
} from "./ws-orders-connector";
import {
  of,
  Subject
} from "rxjs";
import { InstrumentsService } from "../../../modules/instruments/services/instruments.service";
import { OrderInstantTranslatableNotificationsService } from "./order-instant-translatable-notifications.service";
import {
  NewLimitOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder,
  OrderCommandResult
} from "../../models/orders/new-order.model";
import { Side } from "../../models/enums/side.model";
import { LessMore } from "../../models/enums/less-more.model";
import { toUnixTimestampSeconds } from "../../utils/datetime";
import {
  LimitOrderEdit,
  StopLimitOrderEdit,
  StopMarketOrderEdit
} from "../../models/orders/edit-order.model";
import { OrderType } from "../../models/orders/order.model";

describe('WsOrdersService', () => {
  let service: WsOrdersService;
  let wsConnectorSpy: any;
  let instrumentsServiceSpy: any;
  let orderInstantTranslatableNotificationsServiceSpy: any;

  const defaultPortfolio = 'D1234';

  beforeEach(() => {
    wsConnectorSpy = jasmine.createSpyObj('WsOrdersConnector', ['warmUp', 'submitCommand']);
    wsConnectorSpy.submitCommand.and.returnValue(new Subject());

    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
    instrumentsServiceSpy.getInstrument.and.returnValue(of({}));

    orderInstantTranslatableNotificationsServiceSpy = jasmine.createSpyObj(
      'OrderInstantTranslatableNotificationsService',
      [
        'orderCancelled',
        'orderCancelFailed',
        'orderCreated',
        'orderSubmitFailed',
        'orderUpdated',
        'orderUpdateFailed',
      ]);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WsOrdersConnector,
          useValue: wsConnectorSpy
        },
        {
          provide: InstrumentsService,
          useValue: instrumentsServiceSpy
        },
        {
          provide: OrderInstantTranslatableNotificationsService,
          useValue: orderInstantTranslatableNotificationsServiceSpy
        }
      ]
    });
    service = TestBed.inject(WsOrdersService);
  });

  describe('Common checks', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('#submitMarketOrder', () => {
    const submitOrder = (order: NewMarketOrder, onResult?: (result: OrderCommandResult) => void): void => {
      service.submitMarketOrder(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('all parameters should be provided', (done) => {
      const order: NewMarketOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100
      };

      wsConnectorSpy.submitCommand.and.callFake((request: any) => {
        done();

        expect(request.opcode).toBe('create:market');
        expect(request.user.portfolio).toBe(defaultPortfolio);
        expect(request.instrument.symbol).toBe(order.instrument.symbol);
        expect(request.instrument.exchange).toBe(order.instrument.exchange);
        expect(request.side).toBe(order.side);
        expect(request.quantity).toBe(order.quantity);

        return of({ orderNumber: '1' } as OrderCommandResult);
      });

      submitOrder(order);
    });

    it('should notify about success', fakeAsync(() => {
        const order: NewMarketOrder = {
          instrument: {
            symbol: 'ABC',
            exchange: 'MOEX'
          },
          side: Side.Buy,
          quantity: 100
        };

        wsConnectorSpy.submitCommand.and.returnValue(of(
            {
              orderNumber: '1',
              httpCode: 200
            } as CommandResponse
          )
        );

        submitOrder(
          order,
          result => {
            expect(result.isSuccess).toBeTrue();
            expect(result.orderNumber).toBeDefined();
          }
        );

        tick();
        expect(orderInstantTranslatableNotificationsServiceSpy.orderCreated).toHaveBeenCalled();
      })
    );

    it('should notify about error', fakeAsync(() => {
        const order: NewMarketOrder = {
          instrument: {
            symbol: 'ABC',
            exchange: 'MOEX'
          },
          side: Side.Buy,
          quantity: 100
        };

        wsConnectorSpy.submitCommand.and.returnValue(of(
            {
              httpCode: 300
            } as CommandResponse
          )
        );

        submitOrder(
          order,
          result => {
            expect(result.isSuccess).toBeFalse();
          }
        );

        tick();
        expect(orderInstantTranslatableNotificationsServiceSpy.orderSubmitFailed).toHaveBeenCalled();
      })
    );
  });

  describe('#submitLimitOrder', () => {
    const submitOrder = (order: NewLimitOrder, onResult?: (result: OrderCommandResult) => void): void => {
      service.submitLimitOrder(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

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

      wsConnectorSpy.submitCommand.and.callFake((request: any) => {
        done();

        expect(request.opcode).toBe('create:limit');
        expect(request.user.portfolio).toBe(defaultPortfolio);
        expect(request.instrument.symbol).toBe(order.instrument.symbol);
        expect(request.instrument.exchange).toBe(order.instrument.exchange);
        expect(request.side).toBe(order.side);
        expect(request.quantity).toBe(order.quantity);
        expect(request.price).toBe(order.price);

        return of({ orderNumber: '1' } as OrderCommandResult);
      });

      submitOrder(order);
    });

    it('should notify about success', fakeAsync(() => {
      const order: NewLimitOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        price: 100
      };

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            orderNumber: '1',
            httpCode: 200
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderCreated).toHaveBeenCalled();
    }));

    it('should notify about error', fakeAsync(() => {
      const order: NewLimitOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        price: 100
      };

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            httpCode: 300
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeFalse();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderSubmitFailed).toHaveBeenCalled();
    }));
  });

  describe('#submitStopMarketOrder', () => {
    const submitOrder = (order: NewStopMarketOrder, onResult?: (result: OrderCommandResult) => void): void => {
      service.submitStopMarketOrder(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

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

      wsConnectorSpy.submitCommand.and.callFake((request: any) => {
        done();

        expect(request.opcode).toBe('create:stop');
        expect(request.user.portfolio).toBe(defaultPortfolio);
        expect(request.instrument.symbol).toBe(order.instrument.symbol);
        expect(request.instrument.exchange).toBe(order.instrument.exchange);
        expect(request.side).toBe(order.side);
        expect(request.quantity).toBe(order.quantity);
        expect(request.condition).toBe(order.condition);
        expect(request.triggerPrice).toBe(order.triggerPrice);
        expect(request.stopEndUnixTime).toBe(toUnixTimestampSeconds(order.stopEndUnixTime as Date));

        return of({ orderNumber: '1' } as OrderCommandResult);
      });

      submitOrder(order);
    });

    it('should notify about success', fakeAsync(() => {
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

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            orderNumber: '1',
            httpCode: 200
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderCreated).toHaveBeenCalled();
    }));

    it('should notify about error', fakeAsync(() => {
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

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            httpCode: 300
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeFalse();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderSubmitFailed).toHaveBeenCalled();
    }));
  });

  describe('#submitStopLimitOrder', () => {
    const submitOrder = (order: NewStopLimitOrder, onResult?: (result: OrderCommandResult) => void): void => {
      service.submitStopLimitOrder(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

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

      wsConnectorSpy.submitCommand.and.callFake((request: any) => {
        done();

        expect(request.opcode).toBe('create:stoplimit');
        expect(request.user.portfolio).toBe(defaultPortfolio);
        expect(request.instrument.symbol).toBe(order.instrument.symbol);
        expect(request.instrument.exchange).toBe(order.instrument.exchange);
        expect(request.side).toBe(order.side);
        expect(request.quantity).toBe(order.quantity);
        expect(request.condition).toBe(order.condition);
        expect(request.triggerPrice).toBe(order.triggerPrice);
        expect(request.stopEndUnixTime).toBe(toUnixTimestampSeconds(order.stopEndUnixTime as Date));
        expect(request.price).toBe(order.price);

        return of({ orderNumber: '1' } as OrderCommandResult);
      });

      submitOrder(order);
    });

    it('should notify about success', fakeAsync(() => {
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

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            orderNumber: '1',
            httpCode: 200
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderCreated).toHaveBeenCalled();
    }));

    it('should notify about error', fakeAsync(() => {
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

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            httpCode: 300
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeFalse();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderSubmitFailed).toHaveBeenCalled();
    }));
  });

  describe('#submitLimitOrderEdit', () => {
    const submitOrder = (order: LimitOrderEdit, onResult?: (result: OrderCommandResult) => void): void => {
      service.submitLimitOrderEdit(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('all parameters should be provided', (done) => {
      const order: LimitOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        price: 100,
        orderId: '123',
        side: Side.Buy
      };

      wsConnectorSpy.submitCommand.and.callFake((request: any) => {
        done();

        expect(request.opcode).toBe('update:limit');
        expect(request.user.portfolio).toBe(defaultPortfolio);
        expect(request.instrument.symbol).toBe(order.instrument.symbol);
        expect(request.instrument.exchange).toBe(order.instrument.exchange);
        expect(request.quantity).toBe(order.quantity);
        expect(request.price).toBe(order.price);

        return of({ orderNumber: order.orderId } as OrderCommandResult);
      });

      submitOrder(order);
    });

    it('should notify about success', fakeAsync(() => {
      const order: LimitOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        price: 100,
        orderId: '123',
        side: Side.Buy
      };

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            orderNumber: '1',
            httpCode: 200
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderUpdated).toHaveBeenCalled();
    }));

    it('should notify about error', fakeAsync(() => {
      const order: LimitOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        price: 100,
        orderId: '123',
        side: Side.Buy
      };

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            httpCode: 300
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeFalse();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderUpdateFailed).toHaveBeenCalled();
    }));
  });

  describe('#submitStopMarketOrderEdit', () => {
    const submitOrder = (order: StopMarketOrderEdit, onResult?: (result: OrderCommandResult) => void): void => {
      service.submitStopMarketOrderEdit(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('all parameters should be provided', (done) => {
      const orderStopTime = new Date();
      const order: StopMarketOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        orderId: '123',
        condition: LessMore.Less,
        triggerPrice: 100,
        side: Side.Buy,
        stopEndUnixTime: orderStopTime
      };

      wsConnectorSpy.submitCommand.and.callFake((request: any) => {
        done();

        expect(request.opcode).toBe('update:stop');
        expect(request.user.portfolio).toBe(defaultPortfolio);
        expect(request.instrument.symbol).toBe(order.instrument.symbol);
        expect(request.instrument.exchange).toBe(order.instrument.exchange);
        expect(request.quantity).toBe(order.quantity);
        expect(request.side).toBe(order.side);
        expect(request.condition).toBe(order.condition);
        expect(request.triggerPrice).toBe(order.triggerPrice);
        expect(request.stopEndUnixTime).toBe(toUnixTimestampSeconds(orderStopTime));

        return of({ orderNumber: order.orderId } as OrderCommandResult);
      });

      submitOrder(order);
    });

    it('should notify about success', fakeAsync(() => {
      const order: StopMarketOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        orderId: '123',
        condition: LessMore.Less,
        triggerPrice: 100,
        side: Side.Buy,
        stopEndUnixTime: new Date()
      };

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            orderNumber: '1',
            httpCode: 200
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderUpdated).toHaveBeenCalled();
    }));

    it('should notify about error', fakeAsync(() => {
      const order: StopMarketOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        orderId: '123',
        condition: LessMore.Less,
        triggerPrice: 100,
        side: Side.Buy,
        stopEndUnixTime: new Date()
      };

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            httpCode: 300
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeFalse();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderUpdateFailed).toHaveBeenCalled();
    }));
  });

  describe('#submitStopLimitOrderEdit', () => {
    const submitOrder = (order: StopLimitOrderEdit, onResult?: (result: OrderCommandResult) => void): void => {
      service.submitStopLimitOrderEdit(order, defaultPortfolio)
        .subscribe((result) => {
          if (onResult) {
            onResult(result);
          }
        });
    };

    it('all parameters should be provided', (done) => {
      const orderStopTime = new Date();

      const order: StopLimitOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        orderId: '123',
        condition: LessMore.Less,
        triggerPrice: 100,
        price: 100,
        side: Side.Buy,
        stopEndUnixTime: orderStopTime
      };

      wsConnectorSpy.submitCommand.and.callFake((request: any) => {
        done();

        expect(request.opcode).toBe('update:stoplimit');
        expect(request.user.portfolio).toBe(defaultPortfolio);
        expect(request.instrument.symbol).toBe(order.instrument.symbol);
        expect(request.instrument.exchange).toBe(order.instrument.exchange);
        expect(request.quantity).toBe(order.quantity);
        expect(request.side).toBe(order.side);
        expect(request.condition).toBe(order.condition);
        expect(request.triggerPrice).toBe(order.triggerPrice);
        expect(request.stopEndUnixTime).toBe(toUnixTimestampSeconds(orderStopTime));
        expect(request.price).toBe(order.price);

        return of({ orderNumber: order.orderId } as OrderCommandResult);
      });

      submitOrder(order);
    });

    it('should notify about success', fakeAsync(() => {
      const order: StopLimitOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        orderId: '123',
        condition: LessMore.Less,
        triggerPrice: 100,
        price: 100,
        side: Side.Buy,
        stopEndUnixTime: new Date()
      };

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            orderNumber: '1',
            httpCode: 200
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeTrue();
          expect(result.orderNumber).toBeDefined();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderUpdated).toHaveBeenCalled();
    }));

    it('should notify about error', fakeAsync(() => {
      const order: StopLimitOrderEdit = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        orderId: '123',
        condition: LessMore.Less,
        triggerPrice: 100,
        price: 100,
        side: Side.Buy,
        stopEndUnixTime: new Date()
      };

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            httpCode: 300
          } as CommandResponse
        )
      );

      submitOrder(
        order,
        result => {
          expect(result.isSuccess).toBeFalse();
        }
      );

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderUpdateFailed).toHaveBeenCalled();
    }));
  });

  describe('#cancelOrders', () => {
    it('should notify about success', fakeAsync(() => {
      const request = {
        orderId: '123',
        portfolio: defaultPortfolio,
        exchange: 'MOEX',
        orderType: OrderType.Limit
      };

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            orderNumber: '1',
            httpCode: 200
          } as CommandResponse
        )
      );

      service.cancelOrders([request]).subscribe();

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderCancelled).toHaveBeenCalled();
    }));

    it('should notify about error', fakeAsync(() => {
      const request = {
        orderId: '123',
        portfolio: defaultPortfolio,
        exchange: 'MOEX',
        orderType: OrderType.Limit
      };

      wsConnectorSpy.submitCommand.and.returnValue(of(
          {
            httpCode: 300
          } as CommandResponse
        )
      );

      service.cancelOrders([request]).subscribe();

      tick();
      expect(orderInstantTranslatableNotificationsServiceSpy.orderCancelFailed).toHaveBeenCalled();
    }));
  });
});
