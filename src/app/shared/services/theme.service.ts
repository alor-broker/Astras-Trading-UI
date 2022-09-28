import {
  Inject,
  Injectable
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  BehaviorSubject,
  Observable
} from 'rxjs';
import { filter } from 'rxjs/operators';

export enum ThemeType {
  dark = 'dark',
  default = 'default',
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  currentTheme?: ThemeType | null;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document) {
  }

  setTheme(theme: ThemeType): void {
    this.loadCss(theme).pipe(
      filter(x => !!x)
    ).subscribe(() => {
      this.removeUnusedTheme(this.currentTheme);
      this.currentTheme = theme;
      this.document.documentElement.classList.add(this.currentTheme);
    });
  }

  private removeUnusedTheme(theme?: ThemeType | null) {
    if (!theme) {
      return;
    }

    this.document.documentElement.classList.remove(theme);
    const removedThemeStyle = this.document.getElementById(theme);
    if (removedThemeStyle) {
      this.document.head.removeChild(removedThemeStyle);
    }
  }

  private loadCss(theme: ThemeType): Observable<boolean | null> {
    const subj = new BehaviorSubject<boolean | null>(null);
    const style = document.createElement('link');

    style.rel = 'stylesheet';
    style.href = `${theme}.css`;
    style.id = theme;

    style.onload = () => {
      subj.next(true);
      subj.complete();
    };

    style.onerror = () => {
      subj.error({});
    };

    document.head.append(style);

    return subj;
  }
}
