import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Instrument} from "../../../../../shared/models/instruments/instrument.model";
import {CommonParametersService} from "../../../services/common-parameters.service";
import {BehaviorSubject, Subject, Subscription, take} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../../shared/services/portfolio-subscriptions.service";
import {PortfolioKey} from "../../../../../shared/models/portfolio-key.model";
import orderCommandsOrderFormsRu from "../../../../../../assets/i18n/order-commands/order-forms/ru.json";
import {filter} from "rxjs/operators";
import {EditLimitOrderFormComponent} from "./edit-limit-order-form.component";
import {OrderDetailsService} from "../../../../../shared/services/orders/order-details.service";
import {Order} from "../../../../../shared/models/orders/order.model";
import {InstrumentsService} from "../../../../instruments/services/instruments.service";
import {LimitOrderEdit} from "../../../../../shared/models/orders/edit-order.model";
import {OrderFormState} from "../../../models/order-form.model";
import {Side} from "../../../../../shared/models/enums/side.model";
import {TranslocoTestsModule} from "../../../../../shared/utils/testing/translocoTestsModule";
import {TestData} from "../../../../../shared/utils/testing/test-data";
import {commonTestProviders} from "../../../../../shared/utils/testing/common-test-providers";
import {ConfirmableOrderCommandsService} from "../../../services/confirmable-order-commands.service";
import {OrderEvaluationComponent} from "../../order-evaluation/order-evaluation.component";
import {provideAnimations} from "@angular/platform-browser/animations";
import {MockComponent} from "ng-mocks";

describe('EditLimitOrderFormComponent', () => {
  let component: EditLimitOrderFormComponent;
  let fixture: ComponentFixture<EditLimitOrderFormComponent>;

  let orderServiceSpy: any;
  let orderDetailsServiceSpy: any;
  let instrumentsServiceSpy: any;
  let testTearDown: Subscription;

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
    orderServiceSpy = jasmine.createSpyObj('OrderCommandService', ['submitLimitOrderEdit']);
    orderServiceSpy.submitLimitOrderEdit.and.returnValue(new BehaviorSubject({isSuccess: true}));

    orderDetailsServiceSpy = jasmine.createSpyObj('OrderDetailsService', ['getLimitOrderDetails']);
    orderDetailsServiceSpy.getLimitOrderDetails.and.returnValue(new Subject());

    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
    instrumentsServiceSpy.getInstrument.and.returnValue(new BehaviorSubject(TestData.instruments[0]));
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule({
          langs: {
            'order-commands/order-forms/ru': orderCommandsOrderFormsRu,
          }
        }),
        EditLimitOrderFormComponent
      ],
      providers: [
        provideAnimations(),
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
      .overrideComponent(EditLimitOrderFormComponent, {
        remove: {imports: [OrderEvaluationComponent]},
        add: {imports: [MockComponent(OrderEvaluationComponent)]}
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditLimitOrderFormComponent);
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
    const instrument = getDefaultInstrument();

    orderDetailsServiceSpy.getLimitOrderDetails.and.returnValue(new BehaviorSubject({
        targetInstrument: {
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          instrumentGroup: instrument.instrumentGroup
        },
        ownedPortfolio: portfolio,
        price: 1,
        qty: 1
      } as unknown as Order)
    );

    fixture.componentRef.setInput(
      'orderId',
      '111'
    );

    fixture.componentRef.setInput(
      'portfolioKey',
      portfolio
    );

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
      const instrument = getDefaultInstrument();

      orderDetailsServiceSpy.getLimitOrderDetails.and.returnValue(new BehaviorSubject({
          targetInstrument: instrument,
          ownedPortfolio: portfolio,
          price: 1,
          qty: 1
        } as unknown as Order)
      );

      fixture.componentRef.setInput(
        'orderId',
        '111'
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
      const portfolio = getDefaultPortfolio();
      const instrument = getDefaultInstrument();

      const order = {
        targetInstrument: instrument,
        ownedPortfolio: portfolio,
        price: 1,
        qty: 1
      } as unknown as Order;

      orderDetailsServiceSpy.getLimitOrderDetails.and.returnValue(new BehaviorSubject(order));

      fixture.componentRef.setInput(
        'orderId',
        '111'
      );

      fixture.componentRef.setInput(
        'portfolioKey',
        portfolio
      );

      fixture.detectChanges();
      tick();

      const expectedValue = {
        price: order.price,
        quantity: order.qty,
      };

      expect(component.form.value).toEqual(jasmine.objectContaining(expectedValue));
    }
  ));

  it('should pass correct order to service', fakeAsync(() => {
      const portfolio = getDefaultPortfolio();
      const instrument = getDefaultInstrument();
      const order = {
        id: '111',
        targetInstrument: {
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          instrumentGroup: instrument.instrumentGroup
        },
        ownedPortfolio: portfolio,
        price: 10,
        qty: 2,
        side: Side.Buy,
      } as unknown as Order;

      orderDetailsServiceSpy.getLimitOrderDetails.and.returnValue(new BehaviorSubject(order));
      instrumentsServiceSpy.getInstrument.and.returnValue(new BehaviorSubject(instrument));

      fixture.componentRef.setInput(
        'orderId',
        order.id
      );

      fixture.componentRef.setInput(
        'portfolioKey',
        portfolio
      );

      fixture.detectChanges();
      tick();

      const expectedOrder: LimitOrderEdit = {
        orderId: order.id,
        side: order.side,
        price: Math.round(Math.random() * 1000),
        quantity: Math.round(Math.random() * 100),
        instrument: {
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          instrumentGroup: instrument.instrumentGroup
        }
      };

      const formState$ = new BehaviorSubject<OrderFormState | null>(null);

      testTearDown = component.formStateChanged.pipe(
        filter(x => x.isValid),
        take(1)
      ).subscribe(s => {
        formState$.next(s);
      });

      component.form.controls.quantity.setValue(expectedOrder.quantity);
      component.form.controls.price.setValue(expectedOrder.price);
      tick();

      formState$.pipe(
        filter(s => !!s),
        take(1)
      ).subscribe(s => {
        s!.submit!().pipe(
          take(1)
        ).subscribe(() => {
          expect(orderServiceSpy.submitLimitOrderEdit).toHaveBeenCalledOnceWith(
            jasmine.objectContaining(expectedOrder),
            jasmine.objectContaining(portfolio)
          );
        });

        tick();
      });
    })
  );
});
