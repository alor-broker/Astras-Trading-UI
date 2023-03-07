import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { PortfoliosCurrencyFormComponent } from './portfolios-currency-form.component';
import { MarketService } from '../../../../shared/services/market.service';
import { Subject } from 'rxjs';
import { ExchangeRateService } from '../../../../shared/services/exchange-rate.service';
import {
  getTranslocoModule,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';

describe('PortfoliosCurrencyFormComponent', () => {
  let component: PortfoliosCurrencyFormComponent;
  let fixture: ComponentFixture<PortfoliosCurrencyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        getTranslocoModule()
      ],
      declarations: [
        PortfoliosCurrencyFormComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: MarketService,
          useValue: {
            getExchangeSettings: jasmine.createSpy('getExchangeSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: ExchangeRateService,
          useValue: {
            getCurrencies: jasmine.createSpy('getCurrencies').and.returnValue(new Subject())
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PortfoliosCurrencyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
