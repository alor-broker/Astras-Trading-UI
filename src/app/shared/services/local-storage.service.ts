import {Injectable, OnDestroy} from '@angular/core';
import {Observable, Subject} from "rxjs";
import {filter, map, startWith} from "rxjs/operators";

export interface LocalStorageChanges {
  key: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService implements OnDestroy {
  private readonly changes = new Subject<LocalStorageChanges>();

  ngOnDestroy(): void {
    this.changes.complete();
  }

  public setItem<T>(key: string, item: T): void {
    localStorage.setItem(key, JSON.stringify(item));

    this.changes.next({
      key
    });
  }

  public getItem<T>(key: string): T | undefined {
    const json = localStorage.getItem(key);
    if (json == null) {
      return undefined;
    }

    return JSON.parse(json) as T;
  }

  public getStringItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  public getItemStream<T>(key: string): Observable<T | undefined> {
    return this.changes.pipe(
      filter(changes => changes.key === key),
      map(changes => this.getItem<T>(changes.key)),
      startWith(this.getItem<T>(key))
    );
  }

  public removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
