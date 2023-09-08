import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";

export interface CommonParameters {
  price: number | null;
  quantity: number | null;
}

@Injectable()
export class CommonParametersService {
  private readonly parametersChange$ = new BehaviorSubject<Partial<CommonParameters>>({});

  readonly parameters$ = this.parametersChange$.asObservable();

  setParameters(params: Partial<CommonParameters>) {
    this.parametersChange$.next(params);
  }
}
