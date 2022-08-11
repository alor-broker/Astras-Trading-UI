import { TestBed } from '@angular/core/testing';

import { ScalperOrdersService } from './scalper-orders.service';
import { sharedModuleImportForTests } from "../../../shared/utils/testing";
import { OrderCancellerService } from "../../../shared/services/order-canceller.service";
import { PositionsService } from "../../../shared/services/positions.service";
import { OrderService } from "../../../shared/services/orders/order.service";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { ModalService } from "../../../shared/services/modal.service";

describe('ScalperOrdersService', () => {
  let service: ScalperOrdersService;

  let orderCancellerServiceSpy: any;
  let positionsServiceSpy: any;
  let orderServiceSpy: any;
  let notificationServiceSpy: any;
  let modalServiceSpy: any;

  beforeEach(() => {
    orderCancellerServiceSpy = jasmine.createSpyObj('OrderCancellerService', ['cancelOrder']);
    positionsServiceSpy = jasmine.createSpyObj('PositionsService', ['getAllByPortfolio']);

    orderServiceSpy = jasmine.createSpyObj(
      'OrderService',
      [
        'submitMarketOrder',
        'submitLimitOrder',
        'submitStopLimitOrder',
        'submitStopMarketOrder'
      ]
    );

    notificationServiceSpy = jasmine.createSpyObj('NzNotificationService', ['error']);
    modalServiceSpy = jasmine.createSpyObj('ModalService', ['openCommandModal']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        ScalperOrdersService,
        { provide: OrderCancellerService, useValue: orderCancellerServiceSpy },
        { provide: PositionsService, useValue: positionsServiceSpy },
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: notificationServiceSpy, useValue: NzNotificationService },
        { provide: ModalService, useValue: modalServiceSpy },
      ]
    });

    service = TestBed.inject(ScalperOrdersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
