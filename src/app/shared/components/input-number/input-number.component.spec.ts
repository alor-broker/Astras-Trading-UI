import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InputNumberComponent} from './input-number.component';
import {MathHelper} from "../../utils/math-helper";
import { TestingHelpers } from "../../utils/testing/testing-helpers";

describe('InputNumberComponent', () => {
  let component: InputNumberComponent;
  let fixture: ComponentFixture<InputNumberComponent>;

  const inputValueSymbolBySymbol = (value: string): void => {
    component.writeValue(null);
    for (const symbol of value) {
      component.inputElement().nativeElement.value += symbol;
      component.inputElement().nativeElement.dispatchEvent(new Event('input'));
    }
  };

  const inputValue = (value: string): void => {
    component.writeValue(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const symbol of value) {
      component.inputElement().nativeElement.value = value;
      component.inputElement().nativeElement.dispatchEvent(new Event('input'));
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InputNumberComponent
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(InputNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display value from form', () => {
    const cases: { value: number | null, displayValue: string }[] = [
      {
        value: null,
        displayValue: ''
      },
      {
        value: 3,
        displayValue: '3'
      },
      {
        value: 0.0415,
        displayValue: '0.0415'
      },
      {
        value: 100.75,
        displayValue: '100.75'
      },
    ];

    for (const testCase of cases) {
      component.writeValue(testCase.value);
      expect(component.inputElement().nativeElement.value)
        .withContext(`Value: ${testCase.value}. Expected value: ${testCase.displayValue}`)
        .toBe(testCase.displayValue);
    }
  });

  it('should only allow numbers (symbol by symbol)', () => {
      const cases: { input: string, displayValue: string, formValue: number }[] = [
        {
          input: '3',
          displayValue: '3',
          formValue: 3
        },
        {
          input: '0.001',
          displayValue: '0.001',
          formValue: 0.001
        },
        {
          input: '45.6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '45,6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '45..6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '45,,6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '45.,6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '45.,6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '3ss',
          displayValue: '3',
          formValue: 3
        },
        {
          input: '3.',
          displayValue: '3.',
          formValue: 3
        },
        {
          input: '35.ddvv',
          displayValue: '35.',
          formValue: 35
        },
        {
          input: '35.45dff',
          displayValue: '35.45',
          formValue: 35.45
        },
        {
          input: '-10.25',
          displayValue: '10.25',
          formValue: 10.25
        },
      ];

      for (const testCase of cases) {
        inputValueSymbolBySymbol(testCase.input);

        expect(component.inputElement().nativeElement.value)
          .withContext(`Input: ${testCase.input}. Expected display value: ${testCase.displayValue}`)
          .toBe(testCase.displayValue);

        expect(component.value)
          .withContext(`Input: ${testCase.input}. Expected form value: ${testCase.formValue}`)
          .toBe(testCase.formValue);
      }
    }
  );

  it('should only allow numbers (copy/paste)', () => {
      const cases: { input: string, displayValue: string, formValue: number }[] = [
        {
          input: '3',
          displayValue: '3',
          formValue: 3
        },
        {
          input: '0.001',
          displayValue: '0.001',
          formValue: 0.001
        },
        {
          input: '45.6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '45,6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '45..6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '45,,6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '45.,6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '45.,6',
          displayValue: '45.6',
          formValue: 45.6
        },
        {
          input: '3ss',
          displayValue: '3',
          formValue: 3
        },
        {
          input: '3.',
          displayValue: '3.',
          formValue: 3
        },
        {
          input: '35.ddvv',
          displayValue: '35.',
          formValue: 35
        },
        {
          input: '35.45dff',
          displayValue: '35.45',
          formValue: 35.45
        },
        {
          input: '-10.25',
          displayValue: '10.25',
          formValue: 10.25
        },
      ];

      for (const testCase of cases) {
        inputValue(testCase.input);

        expect(component.inputElement().nativeElement.value)
          .withContext(`Input: ${testCase.input}. Expected display value: ${testCase.displayValue}`)
          .toBe(testCase.displayValue);

        expect(component.value)
          .withContext(`Input: ${testCase.input}. Expected form value: ${testCase.formValue}`)
          .toBe(testCase.formValue);
      }
    }
  );

  it('should allow negative when configured', () => {
    fixture.componentRef.setInput(
      'allowNegative',
      true
    );

    const cases: { input: string, displayValue: string, formValue: number }[] = [
      {
        input: '-10.25',
        displayValue: '-10.25',
        formValue: -10.25
      },
      {
        input: '-0.0000025',
        displayValue: '-0.0000025',
        formValue: -0.0000025
      },
      {
        input: '100',
        displayValue: '100',
        formValue: 100
      },
    ];

    for (const testCase of cases) {
      inputValueSymbolBySymbol(testCase.input);

      expect(component.inputElement().nativeElement.value)
        .withContext(`Input: ${testCase.input}. Expected display value: ${testCase.displayValue}`)
        .toBe(testCase.displayValue);

      expect(component.value)
        .withContext(`Input: ${testCase.input}. Expected form value: ${testCase.formValue}`)
        .toBe(testCase.formValue);
    }

    for (const testCase of cases) {
      inputValue(testCase.input);

      expect(component.inputElement().nativeElement.value)
        .withContext(`Input: ${testCase.input}. Expected display value: ${testCase.displayValue}`)
        .toBe(testCase.displayValue);

      expect(component.value)
        .withContext(`Input: ${testCase.input}. Expected form value: ${testCase.formValue}`)
        .toBe(testCase.formValue);
    }
  });

  it('should process arrow', () => {
    const initialValue = 5.102;
    const step = 0.001;

    fixture.componentRef.setInput(
      'step',
      step
    );

    component.writeValue(initialValue);

    expect(component.inputElement().nativeElement.value).toBe(initialValue.toString());

    component.inputElement().nativeElement.dispatchEvent(new KeyboardEvent('keydown', {code: 'ArrowDown'}));
    let expectedValue = MathHelper.round(initialValue - step, 3);
    expect(component.inputElement().nativeElement.value)
      .withContext('ArrowDown')
      .toBe(expectedValue.toString());

    component.writeValue(initialValue);
    component.inputElement().nativeElement.dispatchEvent(new KeyboardEvent('keydown', {code: 'ArrowDown', shiftKey: true}));
    expectedValue = MathHelper.round(initialValue - (step * 10), 3);
    expect(component.inputElement().nativeElement.value)
      .withContext('ArrowDown + Shift')
      .toBe(expectedValue.toString());

    component.writeValue(initialValue);
    component.inputElement().nativeElement.dispatchEvent(new KeyboardEvent('keydown', {code: 'ArrowUp'}));
    expectedValue = MathHelper.round(initialValue + step, 3);
    expect(component.inputElement().nativeElement.value)
      .withContext('ArrowUp')
      .toBe(expectedValue.toString());

    component.writeValue(initialValue);
    component.inputElement().nativeElement.dispatchEvent(new KeyboardEvent('keydown', {code: 'ArrowUp', shiftKey: true}));
    expectedValue = MathHelper.round(initialValue + (step * 10), 3);
    expect(component.inputElement().nativeElement.value)
      .withContext('ArrowUp + Shift')
      .toBe(expectedValue.toString());
  });

  it('should process mouse wheel', () => {
    const initialValue = 5.102;
    const step = 0.001;

    fixture.componentRef.setInput(
      'step',
      step
    );
    component.writeValue(initialValue);

    expect(component.inputElement().nativeElement.value).toBe(initialValue.toString());

    component.inputElement().nativeElement.focus();
    component.inputElement().nativeElement.dispatchEvent(new WheelEvent('wheel', {deltaY: 1}));
    let expectedValue = MathHelper.round(initialValue - step, 3);
    expect(component.inputElement().nativeElement.value)
      .withContext('deltaY > 0')
      .toBe(expectedValue.toString());

    component.writeValue(initialValue);
    component.inputElement().nativeElement.dispatchEvent(new WheelEvent('wheel', {deltaY: 1, shiftKey: true}));
    expectedValue = MathHelper.round(initialValue - (step * 10), 3);
    expect(component.inputElement().nativeElement.value)
      .withContext('deltaY > 0 + Shift')
      .toBe(expectedValue.toString());

    component.writeValue(initialValue);
    component.inputElement().nativeElement.dispatchEvent(new WheelEvent('wheel', {deltaY: -1}));
    expectedValue = MathHelper.round(initialValue + step, 3);
    expect(component.inputElement().nativeElement.value)
      .withContext('deltaY < 0')
      .toBe(expectedValue.toString());

    component.writeValue(initialValue);
    component.inputElement().nativeElement.dispatchEvent(new WheelEvent('wheel', {deltaY: -1, shiftKey: true}));
    expectedValue = MathHelper.round(initialValue + (step * 10), 3);
    expect(component.inputElement().nativeElement.value)
      .withContext('deltaY < 0 + Shift')
      .toBe(expectedValue.toString());
  });

  it('should not process mouse wheel when field is not focused', () => {
    const initialValue = +(TestingHelpers.getRandomInt(1, 100).toString() + '.' + TestingHelpers.getRandomInt(100, 999).toString());
    fixture.componentRef.setInput(
      'step',
      0.001
    );
    component.writeValue(initialValue);

    component.inputElement().nativeElement.dispatchEvent(new WheelEvent('wheel', {deltaY: 1}));

    expect(component.inputElement().nativeElement.value).toBe(initialValue.toString());
  });
});
