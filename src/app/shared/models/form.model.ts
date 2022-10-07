//https://github.com/ngneat/reactive-forms/blob/master/libs/reactive-forms/src/lib/types.ts

import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup
} from '@angular/forms';

type NonUndefined<T> = T extends undefined ? never : T;

export type ControlsOf<T extends Record<string, any>> = {
  [K in keyof T]: NonUndefined<T[K]> extends (infer R extends AbstractControl<any, any>)[]
    ? FormArray<R>
    : NonUndefined<T[K]> extends Date
      ? FormControl<T[K] | null>
      : NonUndefined<T[K]> extends Record<any, any>
        ? FormGroup<ControlsOf<T[K]>>
        : FormControl<T[K] | null>;
};
