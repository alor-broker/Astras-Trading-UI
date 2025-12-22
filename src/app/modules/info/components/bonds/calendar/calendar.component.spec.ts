import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CalendarComponent} from './calendar.component';
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";
import {
  AdditionalInformation,
  BasicInformation,
  BoardInformation,
  Bond,
  CurrencyInformation,
  FinancialAttributes,
  TradingDetails
} from "../../../../../../generated/graphql.types";
import {MockDirective} from "ng-mocks";
import {TableRowHeightDirective} from "../../../../../shared/directives/table-row-height.directive";

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;
  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CalendarComponent,
        TranslocoTestsModule.getModule(),
        MockDirective(TableRowHeightDirective)
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'bond',
      {
        basicInformation: {} as BasicInformation,
        boardInformation: {} as BoardInformation,
        currencyInformation: {} as CurrencyInformation,
        financialAttributes: {} as FinancialAttributes,
        additionalInformation: {} as AdditionalInformation,
        tradingDetails: {} as TradingDetails,
        coupons: [],
        offers: [],
        amortizations: [],
        currentFaceValue: 1,
        faceValue: 1,
        guaranteed: true,
        hasAmortization: false,
        hasOffer: false,
        pledged: false
      } as Bond
    );

    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
