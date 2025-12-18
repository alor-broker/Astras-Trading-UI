import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PortfoliosCurrencyFormComponent} from './portfolios-currency-form.component';
import {MarketService} from '../../../../shared/services/market.service';
import {Subject} from 'rxjs';
import {ExchangeRateService} from '../../../../shared/services/exchange-rate.service';
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents} from "ng-mocks";
import {NzTypographyComponent} from "ng-zorro-antd/typography";

describe('PortfoliosCurrencyFormComponent', () => {
  let component: PortfoliosCurrencyFormComponent;
  let fixture: ComponentFixture<PortfoliosCurrencyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        PortfoliosCurrencyFormComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          NzTypographyComponent
        )
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
