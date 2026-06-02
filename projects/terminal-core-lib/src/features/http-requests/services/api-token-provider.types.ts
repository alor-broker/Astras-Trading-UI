import {Observable} from 'rxjs';

export interface TokenState {
  token: string;
  expirationTime: number;
  refreshCallback: () => Observable<boolean>;
}
