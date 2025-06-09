import { FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { AtsValidators } from './form-validators';
import { Observable, of } from 'rxjs';
import { TitleCasePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';

describe('AtsValidators', () => {
  describe('priceStepMultiplicity', () => {
    const validatorFn = AtsValidators.priceStepMultiplicity;

    it('should return null if control value is null', () => {
      const control = new FormControl(null);
      expect(validatorFn(0.1)(control)).toBeNull();
    });

    it('should return null if control value is undefined', () => {
      const control = new FormControl(undefined);
      expect(validatorFn(0.1)(control)).toBeNull();
    });

    it('should return null if priceStep is 0', () => {
      const control = new FormControl(10);
      expect(validatorFn(0)(control)).toBeNull();
    });

    it('should return null if priceStep is null', () => {
      const control = new FormControl(10);
      // @ts-ignore: Testing invalid input
      expect(validatorFn(null)(control)).toBeNull();
    });

    it('should return error if value precision is greater than priceStep precision', () => {
      const control = new FormControl(0.123);
      const priceStep = 0.1;
      const errors = validatorFn(priceStep)(control);
      expect(errors).toEqual({ priceStepMultiplicity: { step: priceStep } });
    });

    it('should return null if value is a multiple of priceStep', () => {
      const control = new FormControl(1.0);
      expect(validatorFn(0.5)(control)).toBeNull();

      const control2 = new FormControl(1.5);
      expect(validatorFn(0.5)(control2)).toBeNull();

      const control3 = new FormControl(1.23);
      expect(validatorFn(0.01)(control3)).toBeNull();
    });

    it('should return error if value is not a multiple of priceStep', () => {
      const control = new FormControl(1.2);
      const priceStep = 0.5;
      const errors = validatorFn(priceStep)(control);
      expect(errors).toEqual({ priceStepMultiplicity: { step: priceStep } });
    });

    it('should handle negative values correctly (valid)', () => {
      const control = new FormControl(-1.0);
      expect(validatorFn(0.5)(control)).toBeNull();
    });

    it('should handle negative values correctly (invalid)', () => {
      const control = new FormControl(-1.2);
      const priceStep = 0.5;
      const errors = validatorFn(priceStep)(control);
      expect(errors).toEqual({ priceStepMultiplicity: { step: priceStep } });
    });

    it('should return null if value modulo priceStep (after rounding) is 0', () => {
      const control = new FormControl(0.20); // 0.20 % 0.1 = 0
      expect(validatorFn(0.1)(control)).toBeNull();
    });

    it('should work with integer priceStep', () => {
      const controlValid = new FormControl(10);
      expect(validatorFn(2)(controlValid)).toBeNull();

      const controlInvalid = new FormControl(11);
      const priceStep = 2;
      const errors = validatorFn(priceStep)(controlInvalid);
      expect(errors).toEqual({ priceStepMultiplicity: { step: priceStep } });
    });
  });

  describe('priceStepMultiplicityAsync', () => {
    const validatorFn = AtsValidators.priceStepMultiplicityAsync;

    it('should return null if priceStep$ emits null', async () => {
      const control = new FormControl(10);
      const priceStep$ = of(null);
      const result = await firstValueFrom(validatorFn(priceStep$)(control) as Observable<ValidationErrors | null>);
      expect(result).toBeNull();
    });

    it('should return null if priceStep$ emits 0', async () => {
      const control = new FormControl(10);
      const priceStep$ = of(0);
      const result = await firstValueFrom(validatorFn(priceStep$)(control) as Observable<ValidationErrors | null>);
      expect(result).toBeNull();
    });

    it('should delegate to priceStepMultiplicity when priceStep$ emits a valid step (valid case)', async () => {
      const control = new FormControl(1.0);
      const priceStep = 0.5;
      const priceStep$ = of(priceStep);
      const result = await firstValueFrom(validatorFn(priceStep$)(control) as Observable<ValidationErrors | null>);
      expect(result).toBeNull();
    });

    it('should delegate to priceStepMultiplicity when priceStep$ emits a valid step (invalid case)', async () => {
      const control = new FormControl(1.2);
      const priceStep = 0.5;
      const priceStep$ = of(priceStep);
      const result = await firstValueFrom(validatorFn(priceStep$)(control) as Observable<ValidationErrors | null>);
      expect(result).toEqual({ priceStepMultiplicity: { step: priceStep } });
    });

    it('should take only one value from priceStep$', (done) => {
      const control = new FormControl(1.0);
      let emissionCount = 0;
      const priceStep$ = new Observable<number | null>(subscriber => {
        emissionCount++;
        subscriber.next(0.5);
        subscriber.next(0.1); // Should be ignored
        subscriber.complete();
      });

      (validatorFn(priceStep$)(control) as Observable<ValidationErrors | null>).subscribe(() => {
        expect(emissionCount).toBe(1);
        done();
      });
    });
  });

  describe('notNull', () => {
    const validator = AtsValidators.notNull;

    it('should return { required: true } if control value is null', () => {
      const control = new FormControl(null);
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return { required: true } if control value is undefined', () => {
      const control = new FormControl(undefined);
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return null if control value is 0', () => {
      const control = new FormControl(0);
      expect(validator(control)).toBeNull();
    });

    it('should return null if control value is an empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null if control value is an empty array', () => {
      const control = new FormControl([]);
      expect(validator(control)).toBeNull();
    });

    it('should return null if control value is an empty object', () => {
      const control = new FormControl({});
      expect(validator(control)).toBeNull();
    });

    it('should return null if control value is a non-null value', () => {
      const control = new FormControl('some value');
      expect(validator(control)).toBeNull();
      const controlNum = new FormControl(123);
      expect(validator(controlNum)).toBeNull();
    });
  });

  describe('notBiggerThan', () => {
    const validator = AtsValidators.notBiggerThan;
    let form: FormGroup;

    beforeEach(() => {
      form = new FormGroup({
        source: new FormControl(null),
        check: new FormControl(null)
      });
    });

    it('should return null if form value is null (or sourceField missing)', () => {
      // This covers !form.value, !form.value[sourceField], !form.value[fieldToCheck]
      form.patchValue({ source: null, check: 10 });
      expect(validator('check', 'source')(form)).toBeNull();

      form.patchValue({ source: 10, check: null });
      expect(validator('check', 'source')(form)).toBeNull();

      const emptyForm = new FormGroup({});
      expect(validator('check', 'source')(emptyForm)).toBeNull();
    });

    it('should return null if conditionFn is provided and returns false', () => {
      form.patchValue({ source: 5, check: 10 });
      const conditionFn = (): boolean => false;
      expect(validator('check', 'source', conditionFn)(form)).toBeNull();
    });

    it('should proceed if conditionFn is provided and returns true', () => {
      form.patchValue({ source: 5, check: 10 }); // check > source
      const conditionFn = (): boolean => true;
      const errorKey = 'checkNotBiggerThan' + new TitleCasePipe().transform('source');
      expect(validator('check', 'source', conditionFn)(form)).toEqual({ [errorKey]: true });
    });

    it('should return null if fieldToCheckValueNum <= sourceFieldValueNum', () => {
      form.patchValue({ source: 10, check: 5 });
      expect(validator('check', 'source')(form)).toBeNull();

      form.patchValue({ source: 10, check: 10 });
      expect(validator('check', 'source')(form)).toBeNull();
    });

    it('should return error if fieldToCheckValueNum > sourceFieldValueNum', () => {
      form.patchValue({ source: 5, check: 10 });
      const errorKey = 'checkNotBiggerThan' + new TitleCasePipe().transform('source');
      expect(validator('check', 'source')(form)).toEqual({ [errorKey]: true });
    });

    it('should handle string numbers correctly', () => {
      form.patchValue({ source: '5', check: '10' });
      const errorKey = 'checkNotBiggerThan' + new TitleCasePipe().transform('source');
      expect(validator('check', 'source')(form)).toEqual({ [errorKey]: true });

      form.patchValue({ source: '10', check: '5' });
      expect(validator('check', 'source')(form)).toBeNull();
    });
  });

  describe('requiredIfTrue', () => {
    const validator = AtsValidators.requiredIfTrue;
    let form: FormGroup;

    beforeEach(() => {
      form = new FormGroup({
        dependency: new FormControl(false),
        dependent: new FormControl(null),
        nested: new FormGroup({
          dependency: new FormControl(false),
          dependent: new FormControl(null)
        })
      });
    });

    it('should return null if dependencyFieldValue is falsy', () => {
      form.get('dependency')?.setValue(false);
      form.get('dependent')?.setValue(null);
      expect(validator('dependency', 'dependent')(form)).toBeNull();

      form.get('dependency')?.setValue(null);
      expect(validator('dependency', 'dependent')(form)).toBeNull();

      form.get('dependency')?.setValue('');
      expect(validator('dependency', 'dependent')(form)).toBeNull();
    });

    it('should return null if dependencyFieldValue is truthy AND dependentFieldValue is truthy', () => {
      form.get('dependency')?.setValue(true);
      form.get('dependent')?.setValue('has value');
      expect(validator('dependency', 'dependent')(form)).toBeNull();
    });

    it('should return error if dependencyFieldValue is truthy AND dependentFieldValue is falsy', () => {
      form.get('dependency')?.setValue(true);
      form.get('dependent')?.setValue(null);
      expect(validator('dependency', 'dependent')(form)).toEqual({ requiredIfTrueDependent: true });

      form.get('dependent')?.setValue('');
      expect(validator('dependency', 'dependent')(form)).toEqual({ requiredIfTrueDependent: true });
    });

    it('should handle nested properties for dependencyField', () => {
      form.get('nested.dependency')?.setValue(true);
      form.get('dependent')?.setValue(null);
      expect(validator('nested.dependency', 'dependent')(form)).toEqual({ requiredIfTrueDependent: true });
    });

    it('should handle nested properties for dependentField', () => {
      form.get('dependency')?.setValue(true);
      form.get('nested.dependent')?.setValue(null);
      expect(validator('dependency', 'nested.dependent')(form)).toEqual({ requiredIfTrueNestedDependent: true });
    });

    it('should handle nested properties for both fields', () => {
      form.get('nested.dependency')?.setValue(true);
      form.get('nested.dependent')?.setValue(null);
      expect(validator('nested.dependency', 'nested.dependent')(form)).toEqual({ requiredIfTrueNestedDependent: true });

      form.get('nested.dependency')?.setValue(true);
      form.get('nested.dependent')?.setValue('filled');
      expect(validator('nested.dependency', 'nested.dependent')(form)).toBeNull();
    });
  });
});
