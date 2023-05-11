import { TestBed } from '@angular/core/testing';

import { ArbitrationExtensionService } from './arbitration-extension.service';
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { QuotesService } from "../../../shared/services/quotes.service";
import { of } from "rxjs";
import { OrderService } from "../../../shared/services/orders/order.service";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";

describe('ArbitrationExtensionService', () => {
  let service: ArbitrationExtensionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LocalStorageService,
          useValue: {
            getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
            setItem: jasmine.createSpy('setItem').and.callThrough(),
          }
        },
        {
          provide: QuotesService,
          useValue: {
            getQuotes: jasmine.createSpy('getQuotes').and.returnValue(of({ ask: 1, bid: 1 }))
          }
        },
        {
          provide: OrderService,
          useValue: {
            submitMarketOrder: jasmine.createSpy('submitMarketOrder').and.returnValue(of({}))
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedPortfolio$: of({ portfolio: 'Test portfolio' })
          }
        }
      ]
    });
    service = TestBed.inject(ArbitrationExtensionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
