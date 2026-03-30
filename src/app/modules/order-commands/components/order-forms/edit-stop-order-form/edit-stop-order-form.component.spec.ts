import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Instrument} from "../../../../../shared/models/instruments/instrument.model";
import {CommonParametersService} from "../../../services/common-parameters.service";
import {BehaviorSubject, of, Subject, Subscription, take} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../../shared/services/portfolio-subscriptions.service";
import {PortfolioKey} from "../../../../../shared/models/portfolio-key.model";
import orderCommandsOrderFormsRu from "../../../../../../assets/i18n/order-commands/order-forms/ru.json";
import {filter} from "rxjs/operators";
import {OrderDetailsService} from "../../../../../shared/services/orders/order-details.service";
import {OrderType, StopOrder} from "../../../../../shared/models/orders/order.model";
import {InstrumentsService} from "../../../../instruments/services/instruments.service";
import {StopMarketOrderEdit} from "../../../../../shared/models/orders/edit-order.model";
import {OrderFormState} from "../../../models/order-form.model";
import {EditStopOrderFormComponent} from "./edit-stop-order-form.component";
import {LessMore} from "../../../../../shared/models/enums/less-more.model";
import {Side} from "../../../../../shared/models/enums/side.model";
import {NZ_I18N, ru_RU} from "ng-zorro-antd/i18n";
import {TimezoneConverterService} from "../../../../../shared/services/timezone-converter.service";
import {TimezoneConverter} from "../../../../../shared/utils/timezone-converter";
import {TimezoneDisplayOption} from "../../../../../shared/models/enums/timezone-display-option";
import {registerLocaleData} from "@angular/common";
import localeRu from '@angular/common/locales/ru';
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";
import {TestData} from "../../../../../shared/utils/testing/test-data";
import {commonTestProviders} from "../../../../../shared/utils/testing/common-test-providers";
import {ConfirmableOrderCommandsService} from "../../../services/confirmable-order-commands.service";
import {provideAnimations} from "@angular/platform-browser/animations";

describe('EditStopOrderFormComponent', () => {
  let component: EditStopOrderFormComponent;
  let fixture: ComponentFixture<EditStopOrderFormComponent>;

  let orderServiceSpy: any;
  let orderDetailsServiceSpy: any;
  let instrumentsServiceSpy: any;
  const timezoneConverter = new TimezoneConverter(TimezoneDisplayOption.MskTime);
  let timezoneConverterServiceSpy: any;
  let testTearDown: Subscription;

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
    orderServiceSpy = jasmine.createSpyObj('OrderCommandService', ['submitStopLimitOrderEdit', 'submitStopMarketOrderEdit']);
    orderServiceSpy.submitStopLimitOrderEdit.and.returnValue(new BehaviorSubject({isSuccess: true}));
    orderServiceSpy.submitStopMarketOrderEdit.and.returnValue(new BehaviorSubject({isSuccess: true}));

    orderDetailsServiceSpy = jasmine.createSpyObj('OrderDetailsService', ['getStopOrderDetails']);
    orderDetailsServiceSpy.getStopOrderDetails.and.returnValue(new Subject());

    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
    instrumentsServiceSpy.getInstrument.and.returnValue(new BehaviorSubject(TestData.instruments[0]));

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
        EditStopOrderFormComponent
      ],
      providers: [
        provideAnimations(),
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
          provide: OrderDetailsService,
          useValue: orderDetailsServiceSpy
        },
        {
          provide: InstrumentsService,
          useValue: instrumentsServiceSpy
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditStopOrderFormComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    testTearDown?.unsubscribe();
  });

  it('should create', () => {
    fixture.componentRef.setInput('orderId', '111');
    fixture.componentRef.setInput('portfolioKey', getDefaultPortfolio());
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show form errors', fakeAsync(() => {
    const portfolio = getDefaultPortfolio();
    const order = {
      id: '111',
      targetInstrument: {
        symbol: 'SBER',
        exchange: 'MOEX',
      },
      ownedPortfolio: portfolio,
      triggerPrice: 10,
      price: 8,
      qty: 2,
      type: OrderType.StopLimit,
      endTime: new Date(),
    } as StopOrder;

    orderDetailsServiceSpy.getStopOrderDetails.and.returnValue(new BehaviorSubject(order));

    fixture.componentRef.setInput(
      'orderId',
      order.id
    );

    fixture.componentRef.setInput(
      'portfolioKey',
      portfolio
    );

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
      const portfolio = getDefaultPortfolio();
      const order = {
        id: '111',
        targetInstrument: {
          symbol: 'SBER',
          exchange: 'MOEX'
        },
        ownedPortfolio: portfolio,
        triggerPrice: 10,
        price: 8,
        qtyBatch: 2,
        type: OrderType.StopLimit,
        endTime: new Date(),
      } as StopOrder;

      orderDetailsServiceSpy.getStopOrderDetails.and.returnValue(new BehaviorSubject(order));

      fixture.componentRef.setInput(
        'orderId',
        order.id
      );

      fixture.componentRef.setInput(
        'portfolioKey',
        portfolio
      );

      fixture.detectChanges();

      component.formStateChanged.pipe(
        take(1)
      ).subscribe(state => {
        expect(state.isValid).toBeFalse();
      });

      component.form.controls.price.setValue(null);
      fixture.detectChanges();
    }
  );

  it('should set initial values', fakeAsync(() => {
      const portfolioKey = getDefaultPortfolio();
      const order = {
        id: '111',
        targetInstrument: {
          symbol: 'SBER',
          exchange: 'MOEX',
        },
        ownedPortfolio: portfolioKey,
        triggerPrice: 10,
        price: 8,
        qtyBatch: 2,
        type: OrderType.StopLimit,
        endTime: new Date(),
      } as StopOrder;

      orderDetailsServiceSpy.getStopOrderDetails.and.returnValue(of(order));

      fixture.componentRef.setInput(
        'orderId',
        order.id
      );

      fixture.componentRef.setInput(
        'portfolioKey',
        portfolioKey
      );

      fixture.detectChanges();
      tick();

      const expectedValue = {
        quantity: order.qtyBatch,
        triggerPrice: order.triggerPrice,
        price: order.price,
        withLimit: true
      };

      expect(component.form.value).toEqual(jasmine.objectContaining(expectedValue));
    }
  ));

  it('should pass correct order to service (market)', fakeAsync(() => {
      const instrument = getDefaultInstrument();
      const portfolio = getDefaultPortfolio();

      const order = {
        id: '111',
        targetInstrument: {
          symbol: 'SBER',
          exchange: 'MOEX',
        },
        ownedPortfolio: portfolio,
        triggerPrice: 10,
        price: 8,
        qtyBatch: 2,
        type: OrderType.StopMarket,
        endTime: new Date(),
        side: Side.Buy
      } as StopOrder;

      orderDetailsServiceSpy.getStopOrderDetails.and.returnValue(of(order));
      instrumentsServiceSpy.getInstrument.and.returnValue(of({
        ...instrument,
        symbol: order.targetInstrument.symbol,
        exchange: order.targetInstrument.exchange
      }));

      fixture.componentRef.setInput(
        'orderId',
        order.id
      );

      fixture.componentRef.setInput(
        'portfolioKey',
        portfolio
      );

      tick();
      fixture.detectChanges();

      const expectedOrder: StopMarketOrderEdit = {
        orderId: order.id,
        triggerPrice: Math.round(Math.random() * 1000),
        condition: LessMore.More,
        quantity: Math.round(Math.random() * 100),
        instrument: order.targetInstrument,
        side: order.side
      };

      const formState$ = new BehaviorSubject<OrderFormState | null>(null);

      testTearDown = component.formStateChanged.pipe(
        filter(x => x.isValid),
        take(1)
      ).subscribe(s => {
        formState$.next(s);
      });

      component.form.controls.quantity.setValue(expectedOrder.quantity);
      component.form.controls.triggerPrice.setValue(expectedOrder.triggerPrice);
      tick();

      formState$.pipe(
        filter(s => !!s),
        take(1)
      ).subscribe(s => {
        s!.submit!().pipe(
          take(1)
        ).subscribe(() => {
          expect(orderServiceSpy.submitStopMarketOrderEdit).toHaveBeenCalledOnceWith(
            jasmine.objectContaining(expectedOrder),
            jasmine.objectContaining(portfolio)
          );
        });
      });

      tick(1000);
    })
  );
});
