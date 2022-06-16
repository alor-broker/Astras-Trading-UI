import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  public setItem<T>(key: string, item: T): void {
    localStorage.setItem(key, JSON.stringify(item));
  }

  public getItem<T>(key: string): T | undefined {
    const json = localStorage.getItem(key);
    if (!json) {
      return undefined;
    }

    return JSON.parse(json) as T;
  }

  public removeItem(key: string) {
    localStorage.removeItem(key);
  }
}
