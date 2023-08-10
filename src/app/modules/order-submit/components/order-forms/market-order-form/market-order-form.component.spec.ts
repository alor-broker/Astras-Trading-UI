import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketOrderFormComponent, MarketOrderFormValue } from './market-order-form.component';
import { OrderSubmitModule } from '../../../order-submit.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests,
  TestData
} from '../../../../../shared/utils/testing';
import { Instrument } from '../../../../../shared/models/instruments/instrument.model';
import {BehaviorSubject, shareReplay, Subject, take} from 'rxjs';
import { Quote } from '../../../../../shared/models/quotes/quote.model';
import { QuotesService } from '../../../../../shared/services/quotes.service';
import ruCommand from "../../../../../../assets/i18n/command/ru.json";
import { EvaluationBaseProperties } from '../../../../../shared/models/evaluation-base-properties.model';
import {InstrumentsService} from "../../../../instruments/services/instruments.service";

describe('MarketOrderFormComponent', () => {
  let component: MarketOrderFormComponent;
  let fixture: ComponentFixture<MarketOrderFormComponent>;

  const expectedPrice = 103;
  const quoteMock = new BehaviorSubject<Quote>({
    last_price: expectedPrice
  } as Quote);

  const getDefaultInstrument: () => Instrument = () => {
    return TestData.instruments[0];
  };

  const getFormInputs = () => {
    return {
      quantity: fixture.nativeElement.querySelector('[formcontrolname="quantity"]').querySelector('input') as HTMLInputElement,
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
        ...commonTestProviders
      ]
    })
      .overrideComponent(
        MarketOrderFormComponent,
        {
          set: {
            providers: [
              {
                provide: QuotesService,
                useValue: {
                  getQuotes: jasmine.createSpy('getQuotes').and.returnValue(quoteMock),
                  unsubscribe: jasmine.createSpy('unsubscribe').and.callThrough()
                }
              },
              {
                provide: InstrumentsService,
                useValue: {
                  getInstrumentBoards: jasmine.createSpy('getInstrumentBoards').and.returnValue(new Subject())
                }
              }
            ]
          }
        }
      )
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketOrderFormComponent);
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
      }
    ];

    const inputs = getFormInputs();

    for (let testCase of cases) {
      const control: HTMLInputElement = (<any>inputs)[testCase.control];
      control.value = testCase.setValue();
      control.dispatchEvent(new Event('input'));

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

  it('should set null value when form invalid', (done) => {
      component.instrument = getDefaultInstrument();
      fixture.detectChanges();

      component.formValueChange.pipe(
        take(1)
      ).subscribe(value => {
        done();
        expect(value.isValid).toBeFalse();
      });

      component.form!.controls.quantity.setValue(null);
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
        const expectedValue: MarketOrderFormValue = {
          quantity: Number(inputs.quantity.value),
          instrumentGroup: inputs.instrumentGroup
        };

        emittedValue$.pipe(
          take(1)
        ).subscribe(value => {
          expect(value).toEqual({value: expectedValue, isValid: true});
        });
      });
    }
  );

  it('should emit new value when form updated', (done) => {
      component.instrument = getDefaultInstrument();
      fixture.detectChanges();
      const inputs = getFormInputs();

      const expectedValue: MarketOrderFormValue = {
        quantity: 125,
        instrumentGroup: 'SPBX'
      };

      const emittedValue$ = component.formValueChange.pipe(
        shareReplay(1)
      );
      emittedValue$.pipe(take(1)).subscribe();

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

  it('should update evaluation', (done) => {
      const instrument = getDefaultInstrument();
      component.instrument = instrument;
      component.activated = true;
      fixture.detectChanges();

      const inputs = getFormInputs();
      const expectedEvaluation: EvaluationBaseProperties = {
        price: expectedPrice,
        lotQuantity: 245,
        instrument: {
          symbol: instrument.symbol,
          exchange: instrument.exchange,
          instrumentGroup: inputs.instrumentGroup,
        },
        instrumentCurrency: instrument.currency
      };

      inputs.quantity.value = expectedEvaluation.lotQuantity.toString();
      inputs.quantity.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      component.evaluation$.subscribe(x => {
        done();
        expect(x).toEqual(expectedEvaluation);
      });
    }
  );

  it('should NOT update evaluation if not activated', () => {
      component.instrument = getDefaultInstrument();
      component.activated = false;
      fixture.detectChanges();

      let isUpdated = false;
      component.evaluation$.subscribe(() => {
        isUpdated = true;
      });

      const inputs = getFormInputs();

      inputs.quantity.value = '106';
      inputs.quantity.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(isUpdated).toBeFalse();
    }
  );
});
