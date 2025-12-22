import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FinanceBarChartComponent} from './finance-bar-chart.component';
import {of} from 'rxjs';
import {ThemeColors, ThemeSettings, ThemeType} from '../../../../../shared/models/settings/theme-settings.model';
import {ThemeService} from '../../../../../shared/services/theme.service';
import {
  AdditionalInformation,
  BasicInformation,
  BoardInformation,
  CurrencyInformation,
  FinancialAttributes,
  TradingDetails
} from "../../../../../../generated/graphql.types";
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";
import {MockProvider} from "ng-mocks";

describe('FinanceBarChartComponent', () => {
  let component: FinanceBarChartComponent;
  let fixture: ComponentFixture<FinanceBarChartComponent>;
  const finance = {
    sales: {
      year: [],
      quarter: []
    },
    netIncome: {
      year: [],
      quarter: []
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
      imports: [
        FinanceBarChartComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(ThemeService)
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FinanceBarChartComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'stockInfo',
      {
        ...finance,
        additionalInformation: {} as AdditionalInformation,
        basicInformation: {} as BasicInformation,
        boardInformation: {} as BoardInformation,
        currencyInformation: {} as CurrencyInformation,
        financialAttributes: {} as FinancialAttributes,
        tradingDetails: {} as TradingDetails,
        dividends: []
      }
    );

    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
