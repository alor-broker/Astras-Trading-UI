import { TestBed } from '@angular/core/testing';

import { CurrentPortfolioOrderService } from './current-portfolio-order.service';
import { Store } from "@ngrx/store";
import { OrderService } from "./order.service";
import { sharedModuleImportForTests } from "../../utils/testing";

describe('CurrentPortfolioOrderService', () => {
  let service: CurrentPortfolioOrderService;

  let orderServiceSpy: any;
  let store: Store;

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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
