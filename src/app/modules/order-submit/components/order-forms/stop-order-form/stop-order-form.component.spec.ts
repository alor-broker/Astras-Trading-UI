import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { StopOrderFormComponent, StopOrderFormValue } from './stop-order-form.component';
import { Instrument } from '../../../../../shared/models/instruments/instrument.model';
import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests,
  TestData
} from '../../../../../shared/utils/testing';
import { of, shareReplay, Subject, take } from 'rxjs';
import { TimezoneConverter } from '../../../../../shared/utils/timezone-converter';
import { TimezoneDisplayOption } from '../../../../../shared/models/enums/timezone-display-option';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NZ_I18N, ru_RU } from 'ng-zorro-antd/i18n';
import { TimezoneConverterService } from '../../../../../shared/services/timezone-converter.service';
import { OrderSubmitModule } from '../../../order-submit.module';
import { addMonthsUnix, getUtcNow } from '../../../../../shared/utils/datetime';
import ruCommand from "../../../../../../assets/i18n/command/ru.json";
import { QuotesService } from '../../../../../shared/services/quotes.service';
import { LessMore } from "../../../../../shared/models/enums/less-more.model";
import { Side } from "../../../../../shared/models/enums/side.model";

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
      quantity: fixture.nativeElement.querySelector('[formcontrolname="quantity"]').querySelector('input') as HTMLInputElement,
      triggerPrice: fixture.nativeElement.querySelector('[formcontrolname="triggerPrice"]').querySelector('input') as HTMLInputElement,
      condition: fixture.nativeElement.querySelector('nz-select[formcontrolname="condition"]') as HTMLSelectElement,
      price: fixture.nativeElement.querySelector('[formcontrolname="price"]')?.querySelector('input') as HTMLInputElement
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
        ...sharedModuleImportForTests,
        getTranslocoModule({
          langs: {
            'command/ru': ruCommand,
          }
        }),
      ],
      providers: [
        { provide: NZ_I18N, useValue: ru_RU },
        { provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy },
        {
          provide: QuotesService,
          useValue: {
            getLastPrice: jasmine.createSpy('getLastPrice').and.returnValue(new Subject())
          }
        },
        ...commonTestProviders
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

  it('should show form errors', async () => {
    component.instrument = getDefaultInstrument();
    fixture.detectChanges();

    component.form!.controls.withLimit.setValue(true);
    component.checkPriceAvailability();
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

      component.form!.controls[testCase.control as keyof StopOrderFormValue]!.markAsDirty();
      component.form!.controls[testCase.control as keyof StopOrderFormValue]!.updateValueAndValidity({ onlySelf: false });

      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const errorElement = getValidationErrorElement(control);

        expect(errorElement).not.toBeNull();

        if (testCase.expectedError) {
          expect(errorElement?.textContent)
            .withContext(testCase.control)
            .toEqual(testCase.expectedError);
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

      component.form!.controls.quantity.setValue(null);
      fixture.detectChanges();
    }
  );

  it('should emit new value when form updated', fakeAsync(() => {
    component.instrument = getDefaultInstrument();
    fixture.detectChanges();
    const dateNow = getUtcNow();
    const expectedDate = timezoneConverter.toTerminalUtcDate(addMonthsUnix(dateNow, 1));

    const expectedValue: StopOrderFormValue = {
      quantity: 125,
      triggerPrice: 126,
      condition: LessMore.Less,
      price: 140,
      stopEndUnixTime: timezoneConverter.terminalToUtc0Date(expectedDate),
      withLimit: true,
      linkedOrder: {
        quantity: 1,
        triggerPrice: null,
        price: null,
        stopEndUnixTime: timezoneConverter.terminalToUtc0Date(expectedDate),
        side: Side.Buy,
        withLimit: false,
        condition: LessMore.More
      },
      allowLinkedOrder: false
    };

    const emittedValue$ = component.formValueChange.pipe(
      shareReplay(1)
    );
    emittedValue$.pipe(take(1)).subscribe();

    component.form!.controls.stopEndUnixTime?.setValue(expectedDate);
    component.form!.controls.linkedOrder.controls.stopEndUnixTime?.setValue(expectedDate);

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

    tick();
    fixture.detectChanges();

    emittedValue$.pipe(
      take(1)
    ).subscribe(value => {
      expect(value).toEqual({value: expectedValue, isValid: true});
    });
  }));
});
