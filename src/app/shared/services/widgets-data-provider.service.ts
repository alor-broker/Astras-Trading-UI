import { Injectable } from '@angular/core';
import { Observable, Subject } from "rxjs";

interface DataProvidersObject {
  [name: string]: Subject<any>;
}

@Injectable({
  providedIn: 'root'
})
export class WidgetsDataProviderService {
  private dataProvidersObj: DataProvidersObject = {};

  addNewDataProvider<T>(name: string) {
    if (this.dataProvidersObj[name]) {
      return;
    }

    this.dataProvidersObj[name] = new Subject<T>();
  }

  getDataProvider<T>(name: string): Observable<T> | undefined {
    return this.dataProvidersObj[name]?.asObservable();
  }

  setDataProviderValue<T>(name: string, value: T) {
    this.dataProvidersObj[name]?.next(value);
  }
}
