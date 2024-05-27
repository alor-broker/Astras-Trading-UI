import {ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';

import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests,
  TestData
} from "../../../../../shared/utils/testing";
import {Instrument} from "../../../../../shared/models/instruments/instrument.model";
import {CommonParametersService} from "../../../services/common-parameters.service";
import {BehaviorSubject, of, Subject} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../../shared/services/portfolio-subscriptions.service";
import {OrderCommandsModule} from "../../../order-commands.module";
import {PortfolioKey} from "../../../../../shared/models/portfolio-key.model";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
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
import { registerLocaleData } from "@angular/common";
import localeRu from '@angular/common/locales/ru';
import { OrdersGroupService } from "../../../../../shared/services/orders/orders-group.service";
import { WsOrdersService } from "../../../../../shared/services/orders/ws-orders.service";

describe('StopOrderFormComponent', () => {
  let component: StopOrderFormComponent;
  let fixture: ComponentFixture<StopOrderFormComponent>;

  let lastPrice = 25;
  let orderServiceSpy: any;
  let orderGroupServiceSpy: any;
  const timezoneConverter = new TimezoneConverter(TimezoneDisplayOption.MskTime);
  let timezoneConverterServiceSpy: any;

  const getFormInputs = (): { [fieldName: string]: HTMLInputElement | HTMLSelectElement } => {
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
    orderServiceSpy = jasmine.createSpyObj('WsOrdersService', ['submitStopLimitOrder', 'submitStopMarketOrder']);
    orderServiceSpy.submitStopLimitOrder.and.returnValue(new Subject());
    orderServiceSpy.submitStopMarketOrder.and.returnValue(new Subject());

    orderGroupServiceSpy = jasmine.createSpyObj('OrdersGroupService', ['submitOrdersGroup']);
    orderGroupServiceSpy.submitOrdersGroup.and.returnValue(new Subject());

    timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
    timezoneConverterServiceSpy.getConverter.and.returnValue(of(timezoneConverter));
  });

  beforeEach(async () => {
    registerLocaleData(localeRu);

    await TestBed.configureTestingModule({
      imports: [
        OrderCommandsModule,
        NoopAnimationsModule,
        getTranslocoModule({
          langs: {
            'order-commands/order-forms/ru': orderCommandsOrderFormsRu,
          }
        }),
        ...sharedModuleImportForTests
      ],
      declarations: [
        StopOrderFormComponent
      ],
      providers: [
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
          provide: WsOrdersService,
          useValue: orderServiceSpy
        },
        {
          provide: OrdersGroupService,
          useValue: orderGroupServiceSpy
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show form errors', async () => {
    component.instrument = getDefaultInstrument();
    component.portfolioKey = getDefaultPortfolio();
    component.activated = true;
    component.form.controls.withLimit.setValue(true);
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

    for (let testCase of cases) {
      const control: HTMLInputElement = (<any>inputs)[testCase.control];
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

      component.form.controls.triggerPrice.setValue(null);
      fixture.detectChanges();

      expect(component.canSubmit).toBeFalse();
    }
  );

  it('should set initial values', async () => {
      const initialValues = {
        price: 10,
        quantity: 2,
        stopOrder: {
          condition: LessMore.Less,
          limit: true
        }
      };

      component.initialValues = initialValues;
      component.instrument = getDefaultInstrument();
      component.portfolioKey = getDefaultPortfolio();
      component.activated = true;
      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const expectedValue = {
          triggerPrice: initialValues.price,
          price: initialValues.price,
          quantity: initialValues.quantity,
          condition: initialValues.stopOrder.condition,
          withLimit: initialValues.stopOrder.limit
        };

        expect(component.form.value).toEqual(jasmine.objectContaining(expectedValue));
      });
    }
  );

  it('should pass correct order to service (StopMarketOrder)', fakeAsync(() => {
      const instrument = getDefaultInstrument();
      const portfolio = getDefaultPortfolio();
      component.instrument = instrument;
      component.portfolioKey = portfolio;
      component.activated = true;
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
        portfolio.portfolio
      );

      discardPeriodicTasks();
    })
  );

  it('should pass correct order to service (StopLimitOrder)', fakeAsync(() => {
      const instrument = getDefaultInstrument();
      const portfolio = getDefaultPortfolio();
      component.instrument = instrument;
      component.portfolioKey = portfolio;
      component.activated = true;
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
        portfolio.portfolio
      );

      discardPeriodicTasks();
    })
  );
});
