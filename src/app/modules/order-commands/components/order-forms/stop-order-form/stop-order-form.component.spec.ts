import {ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Instrument} from "../../../../../shared/models/instruments/instrument.model";
import {CommonParametersService} from "../../../services/common-parameters.service";
import {BehaviorSubject, of, Subject} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../../shared/services/portfolio-subscriptions.service";
import {PortfolioKey} from "../../../../../shared/models/portfolio-key.model";
import orderCommandsOrderFormsRu from "../../../../../../assets/i18n/order-commands/order-forms/ru.json";
import {Side} from "../../../../../shared/models/enums/side.model";
import {NewStopLimitOrder, NewStopMarketOrder} from "../../../../../shared/models/orders/new-order.model";
import {toInstrumentKey} from "../../../../../shared/utils/instruments";
import {StopOrderFormComponent} from "./stop-order-form.component";
import {QuotesService} from "../../../../../shared/services/quotes.service";
import {TimezoneConverter} from "../../../../../shared/utils/timezone-converter";
import {TimezoneDisplayOption} from "../../../../../shared/models/enums/timezone-display-option";
import {NZ_I18N, ru_RU} from "ng-zorro-antd/i18n";
import {TimezoneConverterService} from "../../../../../shared/services/timezone-converter.service";
import {LessMore} from "../../../../../shared/models/enums/less-more.model";
import {registerLocaleData} from "@angular/common";
import localeRu from '@angular/common/locales/ru';
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";
import {TestData} from "../../../../../shared/utils/testing/test-data";
import {commonTestProviders} from "../../../../../shared/utils/testing/common-test-providers";
import {ConfirmableOrderCommandsService} from "../../../services/confirmable-order-commands.service";
import {provideNoopAnimations} from "@angular/platform-browser/animations";

describe('StopOrderFormComponent', () => {
  let component: StopOrderFormComponent;
  let fixture: ComponentFixture<StopOrderFormComponent>;

  const lastPrice = 25;
  let orderServiceSpy: any;
  const timezoneConverter = new TimezoneConverter(TimezoneDisplayOption.MskTime);
  let timezoneConverterServiceSpy: any;

  const getFormInputs = (): Record<string, HTMLInputElement | HTMLSelectElement> => {
    return {
      quantity: fixture.nativeElement.querySelector('[formcontrolname="quantity"]').querySelector('input') as HTMLInputElement,
      triggerPrice: fixture.nativeElement.querySelector('[formcontrolname="triggerPrice"]').querySelector('input') as HTMLInputElement,
      condition: fixture.nativeElement.querySelector('nz-select[formcontrolname="condition"]') as HTMLSelectElement,
      price: fixture.nativeElement.querySelector('[formcontrolname="price"]')?.querySelector('input') as HTMLInputElement
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
    orderServiceSpy = jasmine.createSpyObj('OrderCommandService', ['submitStopLimitOrder', 'submitStopMarketOrder', 'submitOrdersGroup']);
    orderServiceSpy.submitStopLimitOrder.and.returnValue(new Subject());
    orderServiceSpy.submitStopMarketOrder.and.returnValue(new Subject());
    orderServiceSpy.submitOrdersGroup.and.returnValue(new Subject());

    timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
    timezoneConverterServiceSpy.getConverter.and.returnValue(of(timezoneConverter));
  });

  beforeEach(async () => {
    registerLocaleData(localeRu);

    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule({
          langs: {
            'order-commands/order-forms/ru': orderCommandsOrderFormsRu,
          }
        }),
        StopOrderFormComponent
      ],
      providers: [
        provideNoopAnimations(),
        {provide: NZ_I18N, useValue: ru_RU},
        {provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy},
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
          provide: ConfirmableOrderCommandsService,
          useValue: orderServiceSpy
        },
        {
          provide: QuotesService,
          useValue: {
            getLastPrice: jasmine.createSpy('getLastPrice').and.returnValue(new BehaviorSubject(lastPrice))
          }
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopOrderFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput(
      'instrument',
      getDefaultInstrument()
    );

    fixture.componentRef.setInput(
      'portfolioKey',
      getDefaultPortfolio()
    );

    fixture.componentRef.setInput(
      'activated',
      true
    );
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should show form errors', fakeAsync(() => {
    fixture.componentRef.setInput(
      'instrument',
      getDefaultInstrument()
    );

    fixture.componentRef.setInput(
      'portfolioKey',
      getDefaultPortfolio()
    );

    fixture.componentRef.setInput(
      'activated',
      true
    );
    fixture.detectChanges();
    component.form.controls.withLimit.setValue(true);
    fixture.detectChanges();
    tick();

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
        control: 'triggerPrice',
        setValue: () => null,
        expectedError: 'Введите цену'
      },
      {
        control: 'price',
        setValue: () => 1000000001,
        expectedError: 'Слишком много'
      },
      {
        control: 'price',
        setValue: () => null,
        expectedError: 'Введите цену'
      },
    ];

    const inputs = getFormInputs();

    for (const testCase of cases) {
      const control: HTMLInputElement = (inputs as any)[testCase.control];
      control.value = testCase.setValue();
      control.dispatchEvent(new Event('input'));

      (component.form!.controls as any)[testCase.control]!.markAsDirty();
      (component.form!.controls as any)[testCase.control]!.updateValueAndValidity({onlySelf: false});

      fixture.detectChanges();
      tick();

      const errorElement = getValidationErrorElement(control);

      expect(errorElement).not.toBeNull();

      if (testCase.expectedError ?? '') {
        expect(errorElement?.textContent).toEqual(testCase.expectedError);
      }
    }
  }));

  it('should disable submission', () => {
      fixture.componentRef.setInput(
        'instrument',
        getDefaultInstrument()
      );

      fixture.componentRef.setInput(
        'portfolioKey',
        getDefaultPortfolio()
      );

      fixture.componentRef.setInput(
        'activated',
        true
      );
      fixture.detectChanges();

      component.form.controls.triggerPrice.setValue(null);
      fixture.detectChanges();

      expect(component.canSubmit).toBeFalse();
    }
  );

  it('should set initial values', fakeAsync(() => {
      const initialValues = {
        price: 10,
        quantity: 2,
        stopOrder: {
          condition: LessMore.Less,
          limit: true
        }
      };

      fixture.componentRef.setInput(
        'initialValues',
        initialValues
      );
      fixture.componentRef.setInput(
        'instrument',
        getDefaultInstrument()
      );

      fixture.componentRef.setInput(
        'portfolioKey',
        getDefaultPortfolio()
      );

      fixture.componentRef.setInput(
        'activated',
        true
      );

      fixture.detectChanges();
      tick();

      const expectedValue = {
        triggerPrice: initialValues.price,
        price: initialValues.price,
        quantity: initialValues.quantity,
        condition: initialValues.stopOrder.condition,
        withLimit: initialValues.stopOrder.limit
      };

      expect(component.form.value).toEqual(jasmine.objectContaining(expectedValue));
    }
  ));

  it('should pass correct order to service (StopMarketOrder)', fakeAsync(() => {
      const instrument = getDefaultInstrument();
      const portfolio = getDefaultPortfolio();
      fixture.componentRef.setInput(
        'instrument',
        instrument
      );

      fixture.componentRef.setInput(
        'portfolioKey',
        portfolio
      );

      fixture.componentRef.setInput(
        'activated',
        true
      );
      fixture.detectChanges();

      const expectedOrder: NewStopMarketOrder = {
        instrument: toInstrumentKey(instrument),
        side: Math.random() < 0.5 ? Side.Buy : Side.Sell,
        quantity: Math.round(Math.random() * 100),
        condition: Math.random() < 0.5 ? LessMore.Less : LessMore.More,
        triggerPrice: Math.round(Math.random() * 1000),
      };

      component.form.controls.quantity.setValue(expectedOrder.quantity);
      component.form.controls.triggerPrice.setValue(expectedOrder.triggerPrice);
      component.form.controls.condition.setValue(expectedOrder.condition);

      fixture.detectChanges();

      component.submitOrder(expectedOrder.side);
      tick();

      expect(orderServiceSpy.submitStopMarketOrder).toHaveBeenCalledOnceWith(
        jasmine.objectContaining(expectedOrder),
        jasmine.objectContaining(portfolio)
      );

      discardPeriodicTasks();
    })
  );

  it('should pass correct order to service (StopLimitOrder)', fakeAsync(() => {
      const instrument = getDefaultInstrument();
      const portfolio = getDefaultPortfolio();
      fixture.componentRef.setInput(
        'instrument',
        instrument
      );

      fixture.componentRef.setInput(
        'portfolioKey',
        portfolio
      );

      fixture.componentRef.setInput(
        'activated',
        true
      );

      fixture.detectChanges();

      const expectedOrder: NewStopLimitOrder = {
        instrument: toInstrumentKey(instrument),
        side: Math.random() < 0.5 ? Side.Buy : Side.Sell,
        quantity: Math.round(Math.random() * 100),
        condition: Math.random() < 0.5 ? LessMore.Less : LessMore.More,
        triggerPrice: Math.round(Math.random() * 1000),
        price: Math.round(Math.random() * 1000)
      };

      component.form.controls.quantity.setValue(expectedOrder.quantity);
      component.form.controls.triggerPrice.setValue(expectedOrder.triggerPrice);
      component.form.controls.condition.setValue(expectedOrder.condition);
      component.form.controls.withLimit.setValue(true);
      component.form.controls.price.setValue(expectedOrder.price);

      fixture.detectChanges();

      component.submitOrder(expectedOrder.side);
      tick();

      expect(orderServiceSpy.submitStopLimitOrder).toHaveBeenCalledOnceWith(
        jasmine.objectContaining(expectedOrder),
        jasmine.objectContaining(portfolio)
      );

      discardPeriodicTasks();
    })
  );
});
