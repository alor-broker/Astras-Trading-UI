import {Observable} from "rxjs";

export interface OrderFormState {
  isValid: boolean;
  submit?: () => Observable<boolean>;
}
