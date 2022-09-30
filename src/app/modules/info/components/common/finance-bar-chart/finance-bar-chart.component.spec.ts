import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { FinanceBarChartComponent } from './finance-bar-chart.component';
import { of } from 'rxjs';
import {
  ThemeColors,
  ThemeSettings,
  ThemeType
} from '../../../../../shared/models/settings/theme-settings.model';
import { ThemeService } from '../../../../../shared/services/theme.service';

describe('FinanceBarChartComponent', () => {
  let component: FinanceBarChartComponent;
  let fixture: ComponentFixture<FinanceBarChartComponent>;
  let finance = {
    sales: {
      year: [],
      quorter: []
    },
    netIncome: {
      year: [],
      quorter: []
    },
    marketCap: 0,
    currency: '',
    ebitda: 0,
    costEstimate: {
      priceToEarnings: 0,
      pricePerShare: 0,
      dilutedEarningsPerShare: 0
    },
    profitability: {
      returnOnEquity: 0,
      returnOnAssets: 0,
      debtPerEquity: 0,
      netProfitMargin: 0
    },
    dividends: {
      payoutRation: 0,
      averageDividendFor5years: 0,
      lastDividendYield: 0
    },
    trading: {
      closePrice: 0,
      maxFor52Weeks: 0,
      minFor52Weeks: 0,
      averageTurnoverPerDay: 0,
      averageTurnoverPerMonth: 0,
      beta: 0
    }
  };

  const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['getThemeSettings']);
  themeServiceSpy.getThemeSettings.and.returnValue(of({
    theme: ThemeType.dark,
    themeColors: {
      sellColor: 'rgba(239,83,80, 1)',
      sellColorBackground: 'rgba(184, 27, 68, 0.4)',
      buyColor: 'rgba(12, 179, 130, 1',
      buyColorBackground: 'rgba(12, 179, 130, 0.4)',
      componentBackground: '#141414',
      primaryColor: '#177ddc',
      purpleColor: '#51258f',
      errorColor: '#a61d24'
    } as ThemeColors
  } as ThemeSettings));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FinanceBarChartComponent],
      providers: [
        { provide: ThemeService, useValue: themeServiceSpy },
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FinanceBarChartComponent);
    component = fixture.componentInstance;
    component.finance = finance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
