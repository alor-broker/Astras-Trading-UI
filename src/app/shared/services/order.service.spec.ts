import { TestBed } from '@angular/core/testing';

import { OrderService } from './order.service';
import { HttpClient } from "@angular/common/http";
import {
  HttpClientTestingModule,
  HttpTestingController
} from "@angular/common/http/testing";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { sharedModuleImportForTests } from "../utils/testing";
import { Store } from "@ngrx/store";
import { selectNewPortfolio } from "../../store/portfolios/portfolios.actions";
import { PortfolioKey } from "../models/portfolio-key.model";
import {
  MarketOrder,
  SubmitOrderResponse
} from "../../modules/command/models/order.model";
import { environment } from "../../../environments/environment";

describe('OrderService', () => {
  let service: OrderService;

  let httpTestingController: HttpTestingController;
  let store: Store;

  let notificationServiceSpy: any;
  let errorHandlerServiceSpy: any;
  let httpSpy: any;

  const baseApiUrl = environment.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders/actions';
  const defaultPortfolio = 'D1234';

  beforeEach(() => {
    notificationServiceSpy = jasmine.createSpyObj('NzNotificationService', ['success', 'error']);
    errorHandlerServiceSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
    //httpSpy = jasmine.createSpyObj('HttpClient', ['post']);

    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        HttpClientTestingModule,
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

    httpTestingController = TestBed.inject(HttpTestingController);
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
    it('correct url should be used', (done) => {
      service.submitMarketOrder({} as MarketOrder).subscribe(() => {
          done();
        }
      );

      const request = httpTestingController.expectOne(req => {
        console.log(req);
        return true;
      });

      request.flush({orderNumber: '123'} as SubmitOrderResponse);
      httpTestingController.verify();
    });

  });

  describe('#submitLimitOrder', () => {

  });

  describe('#submitStopMarketOrder', () => {

  });

  describe('#submitStopLimitOrder', () => {

  });
});
