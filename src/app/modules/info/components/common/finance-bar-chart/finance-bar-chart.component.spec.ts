import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Finance } from '../../../models/finance.model';

import { FinanceBarChartComponent } from './finance-bar-chart.component';

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

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FinanceBarChartComponent ]
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
