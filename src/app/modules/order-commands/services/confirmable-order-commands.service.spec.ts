import {
  TestBed,
} from '@angular/core/testing';

import {
  ConfirmableOrderCommandsService,
  TargetPortfolio
} from './confirmable-order-commands.service';
import { ORDER_COMMAND_SERVICE_TOKEN, } from "../../../shared/services/orders/order-command.service";
import { MockProvider } from 'ng-mocks';
import { USER_CONTEXT } from "../../../shared/services/auth/user-context";
import { NzModalService } from "ng-zorro-antd/modal";
import { TranslocoTestsModule } from "../../../shared/utils/testing/translocoTestsModule";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting
} from "@angular/common/http/testing";
import { EnvironmentService } from "../../../shared/services/environment.service";
import {
  LimitOrderEdit,
  StopLimitOrderEdit,
  StopMarketOrderEdit
} from "../../../shared/models/orders/edit-order.model";
import { TestingHelpers } from "../../../shared/utils/testing/testing-helpers";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { Side } from "../../../shared/models/enums/side.model";
import {
  of,
  queueScheduler,
  subscribeOn,
  take
} from "rxjs";
import { OrderType } from "../../../shared/models/orders/order.model";
import {
  NewLimitOrder,
  NewLinkedOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder
} from "../../../shared/models/orders/new-order.model";
import { ExecutionPolicy } from "../../../shared/models/orders/orders-group.model";
import { Role } from "../../../shared/models/user/user.model";

describe('ConfirmableOrderCommandsService', () => {
  let service: ConfirmableOrderCommandsService;

  let orderCommandServiceSpy: any;
  let userContextSpy: any;
  let nzModalServiceSpy: any;
  let environmentServiceSpy: any;

  const environmentFeatures: Record<string, boolean> = {
    lowClientRiskCheck: true
  };

  let httpTestingController: HttpTestingController;

  const targetTestPortfolio: TargetPortfolio = {
    portfolio: TestingHelpers.generateRandomString(6),
    exchange: TestingHelpers.generateRandomString(4)
  };

  const setupClientCategoryResponse = (): void => {
    const req = httpTestingController.expectOne(`/md/v2/Clients/${targetTestPortfolio.exchange}/${targetTestPortfolio.portfolio}/risk?format=simple`);
    req.flush({
      clientType: 'LowRisk'
    });
  };

  beforeEach(() => {
    orderCommandServiceSpy = jasmine.createSpyObj(
      "OrderCommandService",
      [
        "submitMarketOrder",
        "submitLimitOrder",
        "submitStopMarketOrder",
        "submitStopLimitOrder",
        "submitOrdersGroup",
        "submitLimitOrderEdit",
        "submitStopMarketOrderEdit",
        "submitStopLimitOrderEdit",
        "cancelOrders",
        "getOrdersConfig"
      ]
    );

    userContextSpy = jasmine.createSpyObj(
      "UserContext",
      [
        "getUser"
      ]
    );

    userContextSpy.getUser.and.returnValue(of({
        roles: [Role.Client]
      })
    );

    nzModalServiceSpy = jasmine.createSpyObj(
      'NzModalService',
      [
        'confirm'
      ]
    );

    environmentServiceSpy = jasmine.createSpyObj(
      'EnvironmentService',
      {},
      {
        features: environmentFeatures,
        apiUrl: ''
      }
    );
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule()
      ],
      providers: [
        ConfirmableOrderCommandsService,
        MockProvider(
          ORDER_COMMAND_SERVICE_TOKEN,
          orderCommandServiceSpy
        ),
        MockProvider(
          USER_CONTEXT,
          userContextSpy
        ),
        MockProvider(
          NzModalService,
          nzModalServiceSpy
        ),
        MockProvider(
          EnvironmentService,
          environmentServiceSpy
        ),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ConfirmableOrderCommandsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#submitMarketOrder', () => {
    it('should call appropriate method', () => {
      environmentFeatures.lowClientRiskCheck = false;

      const order: NewMarketOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100
      };

      orderCommandServiceSpy.submitMarketOrder.and.returnValue(of({}));
      service.submitMarketOrder(order, targetTestPortfolio).pipe(
        subscribeOn(queueScheduler)
      ).subscribe();

      expect(orderCommandServiceSpy.submitMarketOrder).toHaveBeenCalledOnceWith(
        order,
        targetTestPortfolio.portfolio
      );
    });
  });

  describe('#submitLimitOrder', () => {
    it('should call appropriate method', () => {
      environmentFeatures.lowClientRiskCheck = false;

      const order: NewLimitOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        price: 100
      };

      orderCommandServiceSpy.submitLimitOrder.and.returnValue(of({}));
      service.submitLimitOrder(order, targetTestPortfolio).pipe(
        subscribeOn(queueScheduler)
      ).subscribe();

      expect(orderCommandServiceSpy.submitLimitOrder).toHaveBeenCalledOnceWith(
        order,
        targetTestPortfolio.portfolio
      );
    });

    it('should show confirmation', (done) => {
      environmentFeatures.lowClientRiskCheck = true;

      const order: NewLimitOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        price: 100
      };

      nzModalServiceSpy.confirm.and.callFake(() => {
        done();
        expect(true).toBeTrue();
      });

      service.submitLimitOrder(order, targetTestPortfolio).pipe(
        take(1),
        subscribeOn(queueScheduler),
      ).subscribe();

      setupClientCategoryResponse();
    });
  });

  describe('#submitStopMarketOrder', () => {
    it('should call appropriate method', () => {
      environmentFeatures.lowClientRiskCheck = false;

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

      orderCommandServiceSpy.submitStopMarketOrder.and.returnValue(of({}));
      service.submitStopMarketOrder(order, targetTestPortfolio).pipe(
        subscribeOn(queueScheduler)
      ).subscribe();

      expect(orderCommandServiceSpy.submitStopMarketOrder).toHaveBeenCalledOnceWith(
        order,
        targetTestPortfolio.portfolio
      );
    });

    it('should show confirmation', (done) => {
      environmentFeatures.lowClientRiskCheck = true;

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

      nzModalServiceSpy.confirm.and.callFake(() => {
        done();
        expect(true).toBeTrue();
      });

      service.submitStopMarketOrder(order, targetTestPortfolio).pipe(
        take(1),
        subscribeOn(queueScheduler),
      ).subscribe();

      setupClientCategoryResponse();
    });
  });

  describe('#submitStopLimitOrder', () => {
    it('should call appropriate method', () => {
      environmentFeatures.lowClientRiskCheck = false;

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

      orderCommandServiceSpy.submitStopLimitOrder.and.returnValue(of({}));
      service.submitStopLimitOrder(order, targetTestPortfolio).pipe(
        subscribeOn(queueScheduler)
      ).subscribe();

      expect(orderCommandServiceSpy.submitStopLimitOrder).toHaveBeenCalledOnceWith(
        order,
        targetTestPortfolio.portfolio
      );
    });

    it('should show confirmation', (done) => {
      environmentFeatures.lowClientRiskCheck = true;

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

      nzModalServiceSpy.confirm.and.callFake(() => {
        done();
        expect(true).toBeTrue();
      });

      service.submitStopLimitOrder(order, targetTestPortfolio).pipe(
        take(1),
        subscribeOn(queueScheduler),
      ).subscribe();

      setupClientCategoryResponse();
    });
  });

  describe('#submitOrdersGroup', () => {
    it('should call appropriate method', () => {
      environmentFeatures.lowClientRiskCheck = false;

      const order: NewLinkedOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        price: 100,
        type: OrderType.Limit
      };

      orderCommandServiceSpy.submitOrdersGroup.and.returnValue(of({}));
      const executionsPolicy = ExecutionPolicy.OnExecuteOrCancel;

      service.submitOrdersGroup([order], targetTestPortfolio, executionsPolicy).pipe(
        subscribeOn(queueScheduler)
      ).subscribe();

      expect(orderCommandServiceSpy.submitOrdersGroup).toHaveBeenCalledOnceWith(
        [order],
        targetTestPortfolio.portfolio,
        executionsPolicy
      );
    });

    it('should show confirmation', (done) => {
      environmentFeatures.lowClientRiskCheck = true;

      const order: NewLinkedOrder = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        side: Side.Buy,
        quantity: 100,
        price: 100,
        type: OrderType.Limit
      };

      const executionsPolicy = ExecutionPolicy.OnExecuteOrCancel;

      nzModalServiceSpy.confirm.and.callFake(() => {
        done();
        expect(true).toBeTrue();
      });

      service.submitOrdersGroup([order], targetTestPortfolio, executionsPolicy).pipe(
        take(1),
        subscribeOn(queueScheduler),
      ).subscribe();

      setupClientCategoryResponse();
    });
  });

  describe('#submitLimitOrderEdit', () => {
    it('should call appropriate method', () => {
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

      orderCommandServiceSpy.submitLimitOrderEdit.and.returnValue(of({}));
      service.submitLimitOrderEdit(order, targetTestPortfolio).subscribe();
      expect(orderCommandServiceSpy.submitLimitOrderEdit).toHaveBeenCalledOnceWith(
        order,
        targetTestPortfolio.portfolio
      );
    });
  });

  describe('#submitStopMarketOrderEdit', () => {
    it('should call appropriate method', () => {
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

      orderCommandServiceSpy.submitStopMarketOrderEdit.and.returnValue(of({}));
      service.submitStopMarketOrderEdit(order, targetTestPortfolio).subscribe();
      expect(orderCommandServiceSpy.submitStopMarketOrderEdit).toHaveBeenCalledOnceWith(
        order,
        targetTestPortfolio.portfolio
      );
    });
  });

  describe('#submitStopLimitOrderEdit', () => {
    it('should call appropriate method', () => {
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

      orderCommandServiceSpy.submitStopLimitOrderEdit.and.returnValue(of({}));
      service.submitStopLimitOrderEdit(order, targetTestPortfolio).subscribe();
      expect(orderCommandServiceSpy.submitStopLimitOrderEdit).toHaveBeenCalledOnceWith(
        order,
        targetTestPortfolio.portfolio
      );
    });
  });

  describe('#cancelOrders', () => {
    it('should call appropriate method', () => {
      const request = {
        orderId: '123',
        portfolio: targetTestPortfolio.portfolio,
        exchange: targetTestPortfolio.exchange,
        orderType: OrderType.Limit
      };

      orderCommandServiceSpy.cancelOrders.and.returnValue(of({}));
      service.cancelOrders([request]).subscribe();
      expect(orderCommandServiceSpy.cancelOrders).toHaveBeenCalledTimes(1);
    });
  });

  describe('#getOrdersConfig', () => {
    it('should call appropriate method', () => {
      orderCommandServiceSpy.getOrdersConfig.and.returnValue(of({}));
      service.getOrdersConfig();
      expect(orderCommandServiceSpy.getOrdersConfig).toHaveBeenCalledTimes(1);
    });
  });
});
