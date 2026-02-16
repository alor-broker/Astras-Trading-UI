import {Injectable} from '@angular/core';
import {BehaviorSubject, shareReplay} from "rxjs";

export interface CommonParameters {
  price: number | null;
  quantity: number | null;
}

@Injectable()
export class CommonParametersService {
  private readonly parametersChange$ = new BehaviorSubject<Partial<CommonParameters>>({});

  readonly parameters$ = this.parametersChange$
    .asObservable()
    .pipe(
      shareReplay(1)
    )
  ;

  setParameters(params: Partial<CommonParameters>): void {
    this.parametersChange$.next(params);
  }

  reset(): void {
    this.parametersChange$.next({});
  }
}
