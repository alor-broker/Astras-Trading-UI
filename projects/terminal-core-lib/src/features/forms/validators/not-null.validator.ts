import {
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

/**
 * Validating control value for null or undefined value. For arrays, for example, Validators.required returns error if array is empty.
 * This validator will only return an error if the value is null or undefined
 * @returns validation result
 */
export function atsNotNull(control: AbstractControl): ValidationErrors | null {
  if (control.value == null) {
    return {
      required: true
    };
  }

  return null;
}
