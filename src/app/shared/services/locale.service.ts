import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from "./local-storage.service";

@Injectable({
  providedIn: 'root'
})
export class LocaleService {
  private readonly localStorageService = inject(LocalStorageService);

  private readonly LastLocaleStorageKey = 'last-locale';

  get defaultLocale(): 'ru' | 'en' | 'hy' {
    return 'ru';
  }

  get currentLocale(): 'ru' | 'en' | 'hy' {
    return this.localStorageService.getItem(this.LastLocaleStorageKey) ?? this.defaultLocale;
  }

  setLocale(locale: 'ru' | 'en' | 'hy'): void {
    if(locale != this.currentLocale) {
      this.localStorageService.setItem(this.LastLocaleStorageKey, locale);
      setTimeout(() => window.location.reload(), 1000);
    }
  }
}
