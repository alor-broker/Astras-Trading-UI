import {ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';

import {LimitOrderFormComponent} from './limit-order-form.component';
import {Instrument} from "../../../../../shared/models/instruments/instrument.model";
import {CommonParametersService} from "../../../services/common-parameters.service";
import {
  BehaviorSubject,
  EMPTY,
  of,
  Subject,
  take
} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../../shared/services/portfolio-subscriptions.service";
import {PortfolioKey} from "../../../../../shared/models/portfolio-key.model";
import orderCommandsOrderFormsRu from "../../../../../../assets/i18n/order-commands/order-forms/ru.json";
import {Side} from "../../../../../shared/models/enums/side.model";
import {EvaluationBaseProperties} from "../../../../../shared/models/evaluation-base-properties.model";
import {filter} from "rxjs/operators";
import {InstrumentsService} from "../../../../instruments/services/instruments.service";
import {NewLimitOrder} from "../../../../../shared/models/orders/new-order.model";
import {toInstrumentKey} from "../../../../../shared/utils/instruments";
import {EvaluationService} from "../../../../../shared/services/evaluation.service";
import { TimezoneConverter } from "../../../../../shared/utils/timezone-converter";
import { TimezoneDisplayOption } from "../../../../../shared/models/enums/timezone-display-option";
import { TimezoneConverterService } from "../../../../../shared/services/timezone-converter.service";
import { MarketService } from "../../../../../shared/services/market.service";
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";
import { TestData } from "../../../../../shared/utils/testing/test-data";
import { InstrumentBoardSelectMockComponent } from "../../../../../shared/utils/testing/instrument-board-select-mock-component";
import { ComponentHelpers } from "../../../../../shared/utils/testing/component-helpers";
import { commonTestProviders } from "../../../../../shared/utils/testing/common-test-providers";
import { FormsTesting } from "../../../../../shared/utils/testing/forms-testing";
import { InputNumberComponent } from "../../../../../shared/components/input-number/input-number.component";
import { BuySellButtonsComponent } from "../../buy-sell-buttons/buy-sell-buttons.component";
import { OrderCommandService } from "../../../../../shared/services/orders/order-command.service";

describe('LimitOrderFormComponent', () => {
  let component: LimitOrderFormComponent;
  let fixture: ComponentFixture<LimitOrderFormComponent>;

  let orderServiceSpy: any;
  const timezoneConverter = new TimezoneConverter(TimezoneDisplayOption.MskTime);
  let timezoneConverterServiceSpy: any;

  const getFormInputs = (): Record<string, HTMLInputElement> => {
    return {
      quantity: fixture.nativeElement.querySelector('[formcontrolname="quantity"]').querySelector('input') as HTMLInputElement,
      price: fixture.nativeElement.querySelector('[formcontrolname="price"]').querySelector('input') as HTMLInputElement,
    };
  };

  const getValidationErrorElement = (element: HTMLElement): Element | null => {
    const inputContainer = element.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
    if (!inputContainer) {
      return null;
    }

    const errorContainer = inputContainer.querySelector('.ant-form-item-explain-error');

    if (!errorContainer) {
      return null;
    }

    return errorContainer?.children[0];
  };

  const getDefaultInstrument: () => Instrument = () => {
    return TestData.instruments[0];
  };

  const getDefaultPortfolio: () => PortfolioKey = () => {
    return {
      portfolio: 'D39004',
      exchange: 'MOEX'
    };
  };

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj('WsOrdersService', ['submitLimitOrder', 'submitOrdersGroup']);
    orderServiceSpy.submitLimitOrder.and.returnValue(new Subject());

    timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
    timezoneConverterServiceSpy.getConverter.and.returnValue(of(timezoneConverter));
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule({
          langs: {
            'order-commands/order-forms/ru': orderCommandsOrderFormsRu,
          }
        }),
        ...FormsTesting.getTestingModules(),
        InstrumentBoardSelectMockComponent,
        InputNumberComponent,
        BuySellButtonsComponent
      ],
      declarations: [
        LimitOrderFormComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-order-evaluation',
          inputs: ['evaluationProperties']
        }),
      ],
      providers: [
        {
          provide: CommonParametersService,
          useValue: {
            setParameters: jasmine.createSpy('setParameters').and.callThrough(),
            parameters$: new BehaviorSubject({})
          }
        },
        {
          provide: PortfolioSubscriptionsService,
          useValue: {
            getInstrumentPositionSubscription: jasmine.createSpy('getInstrumentPositionSubscription').and.returnValue(new Subject())
          }
        },
        {
          provide: OrderCommandService,
          useValue: orderServiceSpy
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrumentBoards: jasmine.createSpy('getInstrumentBoards').and.returnValue(new Subject())
          }
        },
        {
          provide: EvaluationService,
          useValue: {
            evaluateOrder: jasmine.createSpy('evaluateOrder').and.returnValue(new Subject())
          }
        },
        {
          provide: TimezoneConverterService,
          useValue: timezoneConverterServiceSpy
        },
        {
          provide: MarketService,
          useValue: {
            getMarketSettings: jasmine.createSpy('getMarketSettings').and.returnValue(EMPTY)
          }
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitOrderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show form errors', async () => {
    component.instrument = getDefaultInstrument();
    component.portfolioKey = getDefaultPortfolio();
    component.activated = true;
    fixture.detectChanges();

    const cases: { control: string, setValue: () => any, expectedError?: string }[] = [
      {
        control: 'quantity',
        setValue: () => null,
        expectedError: 'Введите кол-во'
      },
      {
        control: 'quantity',
        setValue: () => 1000000001,
        expectedError: 'Слишком много'
      },
      {
        control: 'price',
        setValue: () => null,
        expectedError: 'Введите цену'
      },
      {
        control: 'price',
        setValue: () => 1000000001,
        expectedError: 'Слишком много'
      }
    ];

    const inputs = getFormInputs();

    for (const testCase of cases) {
      const control: HTMLInputElement = (inputs as any)[testCase.control];
      control.value = testCase.setValue();
      control.dispatchEvent(new Event('input'));

      (component.form!.controls as any)[testCase.control]!.markAsDirty();
      (component.form!.controls as any)[testCase.control]!.updateValueAndValidity({onlySelf: false});

      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const errorElement = getValidationErrorElement(control);

        expect(errorElement).not.toBeNull();

        if (testCase.expectedError ?? '') {
          expect(errorElement?.textContent).toEqual(testCase.expectedError);
        }
      });
    }
  });

  it('should disable submission', () => {
      component.instrument = getDefaultInstrument();
      component.portfolioKey = getDefaultPortfolio();
      component.activated = true;
      fixture.detectChanges();

      component.form.controls.price.setValue(null);
      fixture.detectChanges();

      expect(component.canSubmit).toBeFalse();
    }
  );

  it('should set initial values', async () => {
      const initialValues = {
        price: 10,
        quantity: 2,
        bracket: {
          topOrderPrice: 2,
          topOrderSide: Side.Sell,
          bottomOrderPrice: 20,
          bottomOrderSide: Side.Buy
        }
      };

      component.initialValues = initialValues;
      component.instrument = getDefaultInstrument();
      component.portfolioKey = getDefaultPortfolio();
      component.activated = true;
      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const expectedValue = {
          price: initialValues.price,
          quantity: initialValues.quantity,
          topOrderPrice: initialValues.bracket.topOrderPrice,
          topOrderSide: initialValues.bracket.topOrderSide,
          bottomOrderPrice: initialValues.bracket.bottomOrderPrice,
          bottomOrderSide: initialValues.bracket.bottomOrderSide
        };

        expect(component.form.value).toEqual(jasmine.objectContaining(expectedValue));
      });
    }
  );

  it('should update evaluation', fakeAsync(() => {
      const instrument = getDefaultInstrument();
      const portfolio = getDefaultPortfolio();
      component.instrument = instrument;
      component.portfolioKey = portfolio;
      component.activated = true;
      fixture.detectChanges();

      tick(1000);
      const inputs = getFormInputs();

      const expectedEvaluation: EvaluationBaseProperties = {
        price: 956,
        lotQuantity: Number(inputs.quantity.value),
        portfolio: portfolio.portfolio,
        instrument: {
          symbol: instrument.symbol,
          exchange: instrument.exchange
        },
        instrumentCurrency: instrument.currency
      };

      inputs.price.value = expectedEvaluation.price.toString();
      inputs.price.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      tick(1000);

      component.evaluationRequest$?.pipe(
        filter(x => !!x),
        take(1)
      ).subscribe(x => {
        expect(x?.instrument).toEqual(jasmine.objectContaining(expectedEvaluation.instrument));
        expect(x?.portfolio).toEqual(expectedEvaluation.portfolio);
        expect(x?.price).toEqual(expectedEvaluation.price);
        expect(x?.lotQuantity).toEqual(expectedEvaluation.lotQuantity);
      });
    })
  );

  it('should pass correct order to service', fakeAsync(() => {
      const instrument = getDefaultInstrument();
      const portfolio = getDefaultPortfolio();
      component.instrument = instrument;
      component.portfolioKey = portfolio;
      component.activated = true;
      fixture.detectChanges();

      const expectedOrder: NewLimitOrder = {
        price: Math.round(Math.random() * 1000),
        quantity: Math.round(Math.random() * 100),
        side: Math.random() < 0.5 ? Side.Buy : Side.Sell,
        instrument: toInstrumentKey(instrument)
      };

      component.form.controls.quantity.setValue(expectedOrder.quantity);
      component.form.controls.price.setValue(expectedOrder.price);

      fixture.detectChanges();

      component.submitOrder(expectedOrder.side);
      tick();

      expect(orderServiceSpy.submitLimitOrder).toHaveBeenCalledOnceWith(
        jasmine.objectContaining(expectedOrder),
        portfolio.portfolio
      );

      discardPeriodicTasks();
    })
  );
});
