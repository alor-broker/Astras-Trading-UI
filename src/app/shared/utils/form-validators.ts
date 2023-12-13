import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
  ValidatorFn
} from "@angular/forms";
import { MathHelper } from "./math-helper";
import {
  Observable,
  take
} from 'rxjs';
import { map } from 'rxjs/operators';
import { TitleCasePipe } from "@angular/common";

export class AtsValidators {
  /**
   * Validating control value for price step multiplicity
   * @param priceStep min step of price
   * @returns validator function
   */
  static priceStepMultiplicity(priceStep: number): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      if (!ctrl.value || !priceStep) {
        return null;
      }

      const priceStepDecimals = MathHelper.getPrecision(priceStep);
      const value = Math.abs(+ctrl.value);

      if (MathHelper.getPrecision(value) > priceStepDecimals) {
        return {
          priceStepMultiplicity: {
            step: priceStep
          }
        };
      }

      const precision = 10 ** priceStepDecimals;
      const valueMOD = Math.round((value % priceStep) * precision) / precision;

      if ((!valueMOD || valueMOD === priceStep)) {
        return null;
      }

      return {
        priceStepMultiplicity: {
          step: priceStep
        }
      };
    };
  }

  /**
   * Validating control value for price step multiplicity
   * @param priceStep$ observable with min step of price
   * @returns validator function
   */
  static priceStepMultiplicityAsync(priceStep$: Observable<number | null>): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return priceStep$.pipe(
        take(1),
        map(step => {
          if (step == null || !step) {
            return null;
          }

          return AtsValidators.priceStepMultiplicity(step as number)(control);
        })
      );
    };
  }

  /**
   * Validating control value for null or undefined value. For arrays, for example, Validators.required returns error if array is empty.
   * This validator will only return an error if the value is null or undefined
   * @returns validation result
   */
  static notNull(control: AbstractControl): ValidationErrors | null {
    if(control.value == null) {
      return {
        required: true
      };
    }

    return null;
  }

  static notBiggerThan(fieldToCheck: string, sourceField: string, conditionFn?: () => boolean): ValidatorFn {
    return (form: AbstractControl): ValidationErrors | null => {
      if (!form.value || !form.value[sourceField] || !form.value[fieldToCheck]) {
        return null;
      }

      if (conditionFn && !conditionFn()) {
        return null;
      }

      const sourceFieldValueNum = Number(form.value[sourceField]);
      const fieldToCheckValueNum = Number(form.value[fieldToCheck]);

      if (fieldToCheckValueNum <= sourceFieldValueNum) {
        return null;
      }

      return {
        [fieldToCheck + 'NotBiggerThan' + TitleCasePipe.prototype.transform(sourceField)]: true
      };
    };
  }

  /**
   * Validating necessity of dependent field, if dependency field has value
   * @returns validation result
   */
  static requiredIfTrue(dependencyField: string, dependentField: string): ValidatorFn {
    return (form: AbstractControl): ValidationErrors | null => {
      const dependencyFieldValue: unknown = dependencyField.split('.')
        .reduce((acc, curr) => acc[curr] as string, form.value);
      const dependentFieldValue: unknown = dependentField.split('.')
        .reduce((acc, curr) => acc[curr] as string, form.value);

      if (!dependencyFieldValue || dependentFieldValue) {
        return null;
      }

      const dependentFieldName = dependentField.split('.')
        .map(s => s[0].toUpperCase() + s.slice(1))
        .join('');

      return {
        ['requiredIfTrue' + dependentFieldName]: true
      };
    };
  }
}
