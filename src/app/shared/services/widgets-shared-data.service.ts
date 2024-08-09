import {
  Injectable,
  OnDestroy
} from "@angular/core";
import {
  BehaviorSubject,
  Observable,
  Subject,
  take
} from "rxjs";
import {
  filter,
  map,
  switchMap
} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class WidgetsSharedDataService implements OnDestroy {
  private readonly dataProviders$ = new BehaviorSubject<Record<string, Subject<any>>>({});

  getDataProvideValues<T>(name: string): Observable<T> {
    this.addNewDataProvider(name);

    return this.dataProviders$.pipe(
      map(p => p[name]),
      filter(p => !!(p as Subject<any> | undefined)),
      switchMap(p => p)
    ) as Observable<T>;
  }

  setDataProviderValue<T>(name: string, value: T): void {
    this.addNewDataProvider(name);

    this.dataProviders$.pipe(
      map(p => p[name]),
      filter((p: any) => !!p),
      take(1)
    ).subscribe(p => {
      p.next(value);
    });
  }

  ngOnDestroy(): void {
    this.dataProviders$.complete();
  }

  private addNewDataProvider<T>(name: string): void {
    this.dataProviders$.pipe(
      take(1)
    ).subscribe(p => {
      if (p[name] as (Subject<T> | undefined)) {
        return;
      }

      this.dataProviders$.next({
        ...p,
        [name]: new Subject<T>()
      });
    });
  }
}
