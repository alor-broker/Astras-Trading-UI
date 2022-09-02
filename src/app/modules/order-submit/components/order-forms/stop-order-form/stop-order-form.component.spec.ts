import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import {
  StopOrderFormComponent,
  StopOrderFormValue
} from './stop-order-form.component';
import { Instrument } from '../../../../../shared/models/instruments/instrument.model';
import {
  sharedModuleImportForTests,
  TestData
} from '../../../../../shared/utils/testing';
import {
  of,
  shareReplay,
  take
} from 'rxjs';
import { TimezoneConverter } from '../../../../../shared/utils/timezone-converter';
import { TimezoneDisplayOption } from '../../../../../shared/models/enums/timezone-display-option';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  NZ_I18N,
  ru_RU
} from 'ng-zorro-antd/i18n';
import { TimezoneConverterService } from '../../../../../shared/services/timezone-converter.service';
import { OrderSubmitModule } from '../../../order-submit.module';
import {
  addMonthsUnix,
  getUtcNow
} from '../../../../../shared/utils/datetime';

describe('StopOrderFormComponent', () => {
  let component: StopOrderFormComponent;
  let fixture: ComponentFixture<StopOrderFormComponent>;

  const timezoneConverter = new TimezoneConverter(TimezoneDisplayOption.MskTime);
  let timezoneConverterServiceSpy: any;

  const getDefaultInstrument: () => Instrument = () => {
    return TestData.instruments[0];
  };

  const getFormInputs = () => {
    return {
      quantity: fixture.nativeElement.querySelector('input[formcontrolname="quantity"]') as HTMLInputElement,
      triggerPrice: fixture.nativeElement.querySelector('input[formcontrolname="triggerPrice"]') as HTMLInputElement,
      condition: fixture.nativeElement.querySelector('nz-select[formcontrolname="condition"]') as HTMLSelectElement,
      price: fixture.nativeElement.querySelector('input[formcontrolname="price"]') as HTMLInputElement
    };
  };

  const getValidationErrorElement = (element: HTMLElement) => {
    const inputContainer = element.parentElement?.parentElement?.parentElement?.parentElement;
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
    timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
    timezoneConverterServiceSpy.getConverter.and.returnValue(of(timezoneConverter));
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StopOrderFormComponent]
    })
      .compileComponents();

    await TestBed.configureTestingModule({
      imports: [
        OrderSubmitModule,
        NoopAnimationsModule,
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: NZ_I18N, useValue: ru_RU },
        { provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopOrderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show form errors', () => {
    component.instrument = getDefaultInstrument();
    fixture.detectChanges();

    component.form!.controls.withLimit.setValue(true);
    fixture.detectChanges();

    const cases: { control: string, setValue: () => any, expectedError?: string }[] = [
      {
        control: 'quantity',
        setValue: () => null,
        expectedError: 'Введите кол-во'
      },
      {
        control: 'quantity',
        setValue: () => -1,
        expectedError: 'Слишком мало'
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
        control: 'triggerPrice',
        setValue: () => -1,
        expectedError: 'Слишком мало'
      },
      {
        control: 'price',
        setValue: () => null,
        expectedError: 'Введите цену'
      },
      {
        control: 'price',
        setValue: () => -1,
        expectedError: 'Слишком мало'
      },
      {
        control: 'price',
        setValue: () => 1000000001,
        expectedError: 'Слишком много'
      }
    ];

    const inputs = getFormInputs();

    cases.forEach(testCase => {
      const control: HTMLInputElement = (<any>inputs)[testCase.control];
      control.value = testCase.setValue();
      control.dispatchEvent(new Event('input'));

      fixture.detectChanges();
      const errorElement = getValidationErrorElement(control);

      expect(errorElement).not.toBeNull();

      if (testCase.expectedError) {
        expect(errorElement?.textContent)
          .withContext(testCase.control)
          .toEqual(testCase.expectedError);
      }
    });
  });

  it('should emit null value when form invalid', (done) => {
      component.instrument = getDefaultInstrument();
      fixture.detectChanges();

      component.formValueChange.pipe(
        take(1)
      ).subscribe(value => {
        done();
        expect(value).toBeNull();
      });

      component.form!.controls.quantity.setValue(null);
      fixture.detectChanges();
    }
  );

  it('should emit new value when form updated', (done) => {
      component.instrument = getDefaultInstrument();
      fixture.detectChanges();
      const expectedDate = timezoneConverter.toTerminalUtcDate(addMonthsUnix(getUtcNow(), 1));

      const expectedValue: StopOrderFormValue = {
        quantity: 125,
        triggerPrice: 126,
        condition: 'Less',
        price: 140,
        stopEndUnixTime: timezoneConverter.terminalToUtc0Date(expectedDate),
        withLimit: true
      };

      const emittedValue$ = component.formValueChange.pipe(
        shareReplay(1)
      );
      emittedValue$.pipe(take(1)).subscribe();

      component.form!.controls.stopEndUnixTime?.setValue(expectedDate);
      component.form!.controls.withLimit.setValue(expectedValue.withLimit);
      fixture.detectChanges();

      const inputs = getFormInputs();

      inputs.quantity.value = expectedValue.quantity.toString();
      inputs.quantity.dispatchEvent(new Event('input'));

      inputs.triggerPrice.value = expectedValue.triggerPrice.toString();
      inputs.triggerPrice.dispatchEvent(new Event('input'));

      // used third party control. Value cannot be changed directly
      component.form!.controls.condition.setValue(expectedValue.condition);
      fixture.detectChanges();

      inputs.price.value = expectedValue.price!.toString();
      inputs.price.dispatchEvent(new Event('input'));

      emittedValue$.pipe(
        take(1)
      ).subscribe(value => {
        done();
        expect(value).toEqual(expectedValue);
      });
    }
  );
});
