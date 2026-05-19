import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import {TitleCasePipe} from '@angular/common';

export function notBiggerThan(fieldToCheck: string, sourceField: string, conditionFn?: () => boolean): ValidatorFn {
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
