import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitOrderFormComponent, LimitOrderFormValue } from './limit-order-form.component';
import { OrderSubmitModule } from '../../../order-submit.module';
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests,
  TestData
} from '../../../../../shared/utils/testing';
import { Instrument } from '../../../../../shared/models/instruments/instrument.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {shareReplay, Subject, take} from 'rxjs';
import ruCommand from "../../../../../../assets/i18n/command/ru.json";
import { EvaluationBaseProperties } from '../../../../../shared/models/evaluation-base-properties.model';
import { Side } from "../../../../../shared/models/enums/side.model";
import {InstrumentsService} from "../../../../instruments/services/instruments.service";

describe('LimitOrderFormComponent', () => {
  let component: LimitOrderFormComponent;
  let fixture: ComponentFixture<LimitOrderFormComponent>;

  const getFormInputs = () => {
    return {
      quantity: fixture.nativeElement.querySelector('[formcontrolname="quantity"]').querySelector('input') as HTMLInputElement,
      price: fixture.nativeElement.querySelector('[formcontrolname="price"]').querySelector('input') as HTMLInputElement,
      instrumentGroup: 'SPBX'
    };
  };

  const getValidationErrorElement = (element: HTMLElement) => {
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

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrderSubmitModule,
        NoopAnimationsModule,
        ...sharedModuleImportForTests,
        getTranslocoModule({
          langs: {
            'command/ru': ruCommand,
          }
        }),
      ],
      declarations: [
        mockComponent({
          selector: 'ats-evaluation',
          inputs: ['evaluationProperties']
        })
      ],
      providers:[
        ...commonTestProviders,
        {
          provide: InstrumentsService,
          useValue: {
            getInstrumentBoards: jasmine.createSpy('getInstrumentBoards').and.returnValue(new Subject())
          }
        }
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

      component.form!.controls[testCase.control as keyof LimitOrderFormValue]!.markAsDirty();
      component.form!.controls[testCase.control as keyof LimitOrderFormValue]!.updateValueAndValidity({ onlySelf: false });

      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const errorElement = getValidationErrorElement(control);

        expect(errorElement).not.toBeNull();

        if (testCase.expectedError) {
          expect(errorElement?.textContent).toEqual(testCase.expectedError);
        }
      });
    }
  });

  it('should emit not valid value when form invalid', (done) => {
      component.instrument = getDefaultInstrument();
      fixture.detectChanges();

      component.formValueChange.pipe(
        take(1)
      ).subscribe(value => {
        done();
        expect(value.isValid).toBeFalse();
      });

      component.form!.controls.price.setValue(null);
      fixture.detectChanges();
    }
  );

  it('should emit default values', async () => {
      const emittedValue$ = component.formValueChange.pipe(
        shareReplay(1)
      );
      emittedValue$.pipe(take(1)).subscribe();

      component.instrument = getDefaultInstrument();
      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const inputs = getFormInputs();
        const expectedValue: LimitOrderFormValue = {
          price: Number(inputs.price.value),
          quantity: Number(inputs.quantity.value),
          instrumentGroup: inputs.instrumentGroup,
          topOrderPrice: null,
          topOrderSide: Side.Buy,
          bottomOrderPrice: null,
          bottomOrderSide: Side.Buy
        };

        emittedValue$.pipe(
          take(1)
        ).subscribe(value => {
          expect(value).toEqual({ value: expectedValue, isValid: false });
        });
      });
    }
  );

  it('should emit new value when form updated', (done) => {
      component.instrument = getDefaultInstrument();
      fixture.detectChanges();
      const inputs = getFormInputs();

      const expectedValue: LimitOrderFormValue = {
        price: 999,
        quantity: 125,
        instrumentGroup: 'SPBX',
        topOrderPrice: null,
        topOrderSide: Side.Buy,
        bottomOrderPrice: null,
        bottomOrderSide: Side.Buy
      };

      const emittedValue$ = component.formValueChange.pipe(
        shareReplay(1)
      );
      emittedValue$.pipe(take(1)).subscribe();

      inputs.price.value = expectedValue.price.toString();
      inputs.price.dispatchEvent(new Event('input'));

      inputs.quantity.value = expectedValue.quantity.toString();
      inputs.quantity.dispatchEvent(new Event('input'));

      emittedValue$.pipe(
        take(1)
      ).subscribe(value => {
        done();
        expect(value).toEqual({ value: expectedValue, isValid: true });
      });
    }
  );

  it('should update price', async () => {
      const emittedValue$ = component.formValueChange.pipe(
        shareReplay(1)
      );
      emittedValue$.pipe(take(1)).subscribe();

      component.instrument = getDefaultInstrument();
      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const inputs = getFormInputs();
        const expectedValue: LimitOrderFormValue = {
          price: 478,
          quantity: Number(inputs.quantity.value),
          instrumentGroup: inputs.instrumentGroup,
          topOrderPrice: null,
          topOrderSide: Side.Buy,
          bottomOrderPrice: null,
          bottomOrderSide: Side.Buy
        };

        component.initialValues = { price: expectedValue.price };
        fixture.detectChanges();

        emittedValue$.pipe(
          take(1)
        ).subscribe(value => {
          expect(value).toEqual({value: expectedValue, isValid: true});
        });
      });
    }
  );

  it('should update evaluation', async () => {
      const instrument = getDefaultInstrument();
      component.instrument = instrument;
      fixture.detectChanges();

      const inputs = getFormInputs();

      await fixture.whenStable().then(() => {
        const expectedEvaluation: EvaluationBaseProperties = {
          price: 956,
          lotQuantity: Number(inputs.quantity.value),
          instrument: {
            symbol: instrument.symbol,
            exchange: instrument.exchange,
            instrumentGroup: inputs.instrumentGroup,
          },
          instrumentCurrency: instrument.currency
        };

        inputs.price.value = expectedEvaluation.price.toString();
        inputs.price.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        component.evaluation$?.subscribe(x => {
          expect(x).toEqual(expectedEvaluation);
        });
      });
    }
  );
});
