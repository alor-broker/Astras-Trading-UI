import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests,
  TestData
} from "../../../../../shared/utils/testing";
import {Instrument} from "../../../../../shared/models/instruments/instrument.model";
import {CommonParametersService} from "../../../services/common-parameters.service";
import {BehaviorSubject, Subject, Subscription, take} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../../shared/services/portfolio-subscriptions.service";
import {OrderService} from "../../../../../shared/services/orders/order.service";
import {OrderCommandsModule} from "../../../order-commands.module";
import {PortfolioKey} from "../../../../../shared/models/portfolio-key.model";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import orderCommandsOrderFormsRu from "../../../../../../assets/i18n/order-commands/order-forms/ru.json";
import {filter} from "rxjs/operators";
import {EvaluationService} from "../../../../../shared/services/evaluation.service";
import {EditLimitOrderFormComponent} from "./edit-limit-order-form.component";
import {OrderDetailsService} from "../../../../../shared/services/orders/order-details.service";
import {Order} from "../../../../../shared/models/orders/order.model";
import {InstrumentsService} from "../../../../instruments/services/instruments.service";
import {LimitOrderEdit} from "../../../../../shared/models/orders/edit-order.model";
import {OrderFormState} from "../../../models/order-form.model";

describe('EditLimitOrderFormComponent', () => {
  let component: EditLimitOrderFormComponent;
  let fixture: ComponentFixture<EditLimitOrderFormComponent>;

  let orderServiceSpy: any;
  let orderDetailsServiceSpy: any;
  let instrumentsServiceSpy: any;
  let testTearDown: Subscription;

  const getFormInputs = (): { [fieldName: string]: HTMLInputElement } => {
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
    orderServiceSpy = jasmine.createSpyObj('OrderService', ['submitLimitOrderEdit']);
    orderServiceSpy.submitLimitOrderEdit.and.returnValue(new BehaviorSubject({isSuccess: true}));

    orderDetailsServiceSpy = jasmine.createSpyObj('OrderDetailsService', ['getLimitOrderDetails']);
    orderDetailsServiceSpy.getLimitOrderDetails.and.returnValue(new Subject());

    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);
    instrumentsServiceSpy.getInstrument.and.returnValue(new BehaviorSubject(TestData.instruments[0]));
  });

  beforeEach(async () => {
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
        EditLimitOrderFormComponent,
        mockComponent({
          selector: 'ats-order-evaluation',
          inputs: ['evaluationProperties']
        })
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
          provide: OrderService,
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
        {
          provide: EvaluationService,
          useValue: {
            evaluateOrder: jasmine.createSpy('evaluateOrder').and.returnValue(new Subject())
          }
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditLimitOrderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    testTearDown?.unsubscribe();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show form errors', async () => {
    orderDetailsServiceSpy.getLimitOrderDetails.and.returnValue(new BehaviorSubject({
        symbol: 'SBER',
        exchange: 'MOEX',
        price: 1,
        qty: 1
      } as Order)
    );

    component.orderId = '111';
    component.portfolioKey = getDefaultPortfolio();
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
      orderDetailsServiceSpy.getLimitOrderDetails.and.returnValue(new BehaviorSubject({
          symbol: 'SBER',
          exchange: 'MOEX',
          price: 1,
          qty: 1
        } as Order)
      );

      component.orderId = '111';
      component.portfolioKey = getDefaultPortfolio();

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

  it('should set initial values', async () => {
      const order = {
        symbol: 'SBER',
        exchange: 'MOEX',
        price: 1,
        qty: 1
      } as Order;

      orderDetailsServiceSpy.getLimitOrderDetails.and.returnValue(new BehaviorSubject(order));

      component.orderId = '111';
      component.portfolioKey = getDefaultPortfolio();
      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const expectedValue = {
          price: order.price,
          quantity: order.qty,
        };

        expect(component.form.value).toEqual(jasmine.objectContaining(expectedValue));
      });
    }
  );


  it('should pass correct order to service', fakeAsync(() => {
      const instrument = getDefaultInstrument();
      const order = {
        id: '111',
        symbol: instrument.symbol,
        exchange: instrument.exchange,
        price: 10,
        qty: 2
      } as Order;

      orderDetailsServiceSpy.getLimitOrderDetails.and.returnValue(new BehaviorSubject(order));
      instrumentsServiceSpy.getInstrument.and.returnValue(new BehaviorSubject(instrument));
      const portfolio = getDefaultPortfolio();

      component.orderId = order.id;
      component.portfolioKey = portfolio;
      fixture.detectChanges();
      tick();

      const expectedOrder: LimitOrderEdit = {
        id: order.id,
        price: Math.round(Math.random() * 1000),
        quantity: Math.round(Math.random() * 100),
        instrument: {
          symbol: instrument.symbol,
          exchange: instrument.exchange
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
            portfolio.portfolio
          );
        });

        tick();
      });
    })
  );
});
