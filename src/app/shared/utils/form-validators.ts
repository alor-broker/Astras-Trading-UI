import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { MathHelper } from "./math-helper";

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
        return { priceStepMultiplicity: true };
      }

      const precision = 10 ** priceStepDecimals;
      const valueMOD = Math.round((value % priceStep) * precision) / precision;

      if ((!valueMOD || valueMOD === priceStep)) {
        return null;
      }

      return { priceStepMultiplicity: true };
    };
  }
}
