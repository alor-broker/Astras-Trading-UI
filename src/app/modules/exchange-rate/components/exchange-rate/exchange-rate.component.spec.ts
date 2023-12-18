import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ExchangeRateComponent } from './exchange-rate.component';
import { ExchangeRateService } from "../../../../shared/services/exchange-rate.service";
import {
  of,
  Subject
} from "rxjs";
import { QuotesService } from '../../../../shared/services/quotes.service';
import { MarketService } from "../../../../shared/services/market.service";

describe('ExchangeRateComponent', () => {
  let component: ExchangeRateComponent;
  let fixture: ComponentFixture<ExchangeRateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExchangeRateComponent],
      providers: [
        {
          provide: ExchangeRateService,
          useValue: {
            getCurrencies: jasmine.createSpy('getCurrencies').and.returnValue(of([]))
          }
        },
        {
          provide: QuotesService,
          useValue: {
            getQuotes: jasmine.createSpy('getQuotes').and.returnValue(new Subject())
          }
        },
        {
          provide: MarketService,
          useValue: {
            getMarketSettings: jasmine.createSpy('getMarketSettings').and.returnValue(new Subject())
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExchangeRateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
