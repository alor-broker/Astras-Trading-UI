import {
  Inject,
  Injectable
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  shareReplay,
  Subscription
} from 'rxjs';
import {
  filter,
  map,
  startWith
} from 'rxjs/operators';
import {
  ThemeColors,
  ThemeSettings,
  ThemeType
} from '../models/settings/theme-settings.model';
import { TerminalSettingsService } from "./terminal-settings.service";
import { HttpClient } from "@angular/common/http";
import { mapWith } from "../utils/observable-helper";
import { LocalStorageService } from "./local-storage.service";
import { LocalStorageCommonConstants } from "../constants/local-storage.constants";

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentTheme?: ThemeType | null;
  private themeSettings$?: Observable<ThemeSettings>;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly terminalSettings: TerminalSettingsService,
    private readonly localStorageService: LocalStorageService,
    private readonly httpClient: HttpClient
  ) {
  }

  subscribeToThemeChanges(): Subscription {
    return this.getThemeSettings().pipe(
      map(s => s.theme),
      startWith(this.localStorageService.getStringItem(LocalStorageCommonConstants.LastThemeStorageKey) as ThemeType ?? ThemeType.dark)
    )
      .subscribe(theme => {
        this.setTheme(theme);
        this.localStorageService.setStringItem(LocalStorageCommonConstants.LastThemeStorageKey, theme);
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
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }

    return this.themeSettings$;
  }

  private getColorsMap(theme: ThemeType): Observable<{ [key: string]: string }> {
    return this.httpClient.get<{ [key: string]: string }>(
      `../../../assets/${theme}-shared-colors-config.json`,
      {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      }
    ).pipe(
      shareReplay(1)
    );
  }

  private setTheme(theme: ThemeType): void {
    this.loadCss(theme).pipe(
      filter(x => x ?? false)
    ).subscribe(() => {
      this.removeUnusedTheme(this.currentTheme);
      this.currentTheme = theme;
      this.document.documentElement.classList.add(this.currentTheme);
    });
  }

  private removeUnusedTheme(theme?: ThemeType | null): void {
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
}
