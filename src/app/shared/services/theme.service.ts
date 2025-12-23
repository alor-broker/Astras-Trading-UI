import { Injectable, DOCUMENT, inject } from '@angular/core';

import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  shareReplay,
  Subscription,
  take
} from 'rxjs';
import {filter, map, startWith} from 'rxjs/operators';
import {ThemeColors, ThemeSettings, ThemeType} from '../models/settings/theme-settings.model';
import {TerminalSettingsService} from "./terminal-settings.service";
import {HttpClient, HttpContext} from "@angular/common/http";
import {mapWith} from "../utils/observable-helper";
import {LocalStorageService} from "./local-storage.service";
import {DesignSettingsConstants} from "../constants/local-storage.constants";
import {HttpContextTokens} from "../constants/http.constants";

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject<Document>(DOCUMENT);
  private readonly terminalSettings = inject(TerminalSettingsService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly httpClient = inject(HttpClient);

  private currentTheme?: ThemeType | null;
  private themeSettings$?: Observable<ThemeSettings>;
  private readonly styleLinkClassName = 'theme';

  subscribeToThemeChanges(): Subscription {
    return this.getThemeSettings().pipe(
      map(s => s.theme),
      startWith(this.localStorageService.getStringItem(DesignSettingsConstants.LastThemeStorageKey) as ThemeType ?? ThemeType.dark)
    )
      .subscribe(theme => {
        this.setTheme(theme);
        this.localStorageService.setStringItem(DesignSettingsConstants.LastThemeStorageKey, theme);
      });
  }

  getThemeSettings(): Observable<ThemeSettings> {
    if (!this.themeSettings$) {
      const lightThemeColorsMap$ = this.getColorsMap(ThemeType.default);
      const darkThemeColorsMap$ = this.getColorsMap(ThemeType.dark);

      this.themeSettings$ = this.terminalSettings.getSettings().pipe(
        distinctUntilChanged((previous, current) => previous.designSettings?.theme === current.designSettings?.theme),
        map(x => x.designSettings?.theme ?? ThemeType.dark),
        mapWith(
          theme => theme === ThemeType.default ? lightThemeColorsMap$ : darkThemeColorsMap$,
          (theme, colorsMap) => {
            const themeColors: ThemeColors = {
              sellColor: colorsMap['sell-color'],
              sellColorBackground: colorsMap['sell-color-background'],
              sellColorAccent: colorsMap['sell-color-accent'],

              buyColor: colorsMap['buy-color'],
              buyColorBackground: colorsMap['buy-color-background'],
              buyColorAccent: colorsMap['buy-color-accent'],
              buyColorBackgroundLight: colorsMap['buy-color-background-light'],

              mixColor: colorsMap['mix-color'],

              buySellBtnTextColor: colorsMap['buy-sell-btn-text-color'],

              componentBackground: colorsMap['component-background'],
              primaryColor: colorsMap['primary-color'],
              errorColor: colorsMap['error-color'],
              purpleColor: colorsMap['purple-color'],
              textColor: colorsMap['text-color'],

              chartGridColor: colorsMap['chart-grid-color'],
              chartLabelsColor: colorsMap['chart-labels-color'],
              chartPrimaryTextColor: colorsMap['chart-primary-text-color'],
              chartShadow: colorsMap['chart-shadow'],
              textMaxContrastColor: colorsMap['text-max-contrast-color'],
              tableGridColor: colorsMap['table-grid-color'],
            };

            return {
              theme,
              themeColors
            };
          }
        ),
        shareReplay({bufferSize: 1, refCount: true})
      );
    }

    return this.themeSettings$;
  }

  attachDefaultStyles(): void {
    this.currentTheme = ThemeType.dark;
    const style = document.createElement('link');
    this.setupThemeCssElement(style, this.currentTheme);
    document.head.prepend(style);
    this.document.documentElement.classList.add(this.currentTheme);
  }

  private getColorsMap(theme: ThemeType): Observable<Record<string, string>> {
    return this.httpClient.get<Record<string, string>>(
      `../../../assets/${theme}-shared-colors-config.json`,
      {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true),
      }
    ).pipe(
      shareReplay(1)
    );
  }

  private setTheme(theme: ThemeType): void {
    this.currentTheme = theme;
    const themeStyle = this.document.getElementById(theme);
    if(themeStyle != null) {
      return;
    }

    this.loadCss(theme).pipe(
      filter(x => x ?? false),
      take(1)
    ).subscribe(() => {
      this.removeUnusedTheme();
      this.document.documentElement.classList.add(this.currentTheme!);
    });
  }

  private removeUnusedTheme(): void {
    Object.values(ThemeType).forEach(v => {
      this.document.documentElement.classList.remove(v);
    });

    const themeStyles = this.document.getElementsByClassName(this.styleLinkClassName);
    Array.from(themeStyles).forEach(s => {
      if (s.id !== this.currentTheme! as string) {
        this.document.head.removeChild(s);
      }
    });
  }

  private loadCss(theme: ThemeType): Observable<boolean | null> {
    const subj = new BehaviorSubject<boolean | null>(null);
    const style = document.createElement('link');
    this.setupThemeCssElement(style, theme);

    style.onload = (): void => {
      subj.next(true);
      subj.complete();
    };

    style.onerror = (): void => {
      subj.error({});
    };

    document.head.prepend(style);

    return subj;
  }

  private setupThemeCssElement(target: HTMLLinkElement, theme: ThemeType): void {
    target.rel = 'stylesheet';
    target.href = `${theme}.css`;
    target.id = theme;
    target.className = this.styleLinkClassName;
  }
}
