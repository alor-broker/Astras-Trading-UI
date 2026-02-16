import {Injectable, OnDestroy} from "@angular/core";
import {BehaviorSubject, Observable, take} from "rxjs";
import {filter, map, switchMap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class WidgetsSharedDataService implements OnDestroy {
  private readonly dataProviders$ = new BehaviorSubject<Record<string, BehaviorSubject<any>>>({});

  getDataProvideValues<T>(name: string): Observable<T | null> {
    this.addNewDataProvider(name);

    return this.dataProviders$.pipe(
      map(p => p[name]),
      filter(p => p != null),
      switchMap(p => p)
    ) as Observable<T | null>;
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
      if (p[name] != null) {
        return;
      }

      this.dataProviders$.next({
        ...p,
        [name]: new BehaviorSubject<T | null>(null)
      });
    });
  }
}
