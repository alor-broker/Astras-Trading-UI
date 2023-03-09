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
          if (!step) {
            return null;
          }

          return AtsValidators.priceStepMultiplicity(step)(control);
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
}
