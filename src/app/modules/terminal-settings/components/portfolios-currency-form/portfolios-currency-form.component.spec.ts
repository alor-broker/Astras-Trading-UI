import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { PortfoliosCurrencyFormComponent } from './portfolios-currency-form.component';
import { MarketService } from '../../../../shared/services/market.service';
import { Subject } from 'rxjs';
import { ExchangeRateService } from '../../../../shared/services/exchange-rate.service';
import {
  commonTestProviders,
  getTranslocoModule,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";

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
            getExchangeSettings: jasmine.createSpy('getExchangeSettings').and.returnValue(new Subject()),
            getMarketSettings: jasmine.createSpy('getMarketSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: ExchangeRateService,
          useValue: {
            getCurrencyPairs: jasmine.createSpy('getCurrencyPairs').and.returnValue(new Subject())
          }
        },
        {
          provide: UserPortfoliosService,
          useValue: {
            getPortfolios: jasmine.createSpy('getPortfolios').and.returnValue(new Subject())
          }
        },
        ...commonTestProviders
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
