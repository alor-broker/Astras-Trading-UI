import {
  Inject,
  Injectable
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  Subscription
} from 'rxjs';
import {
  filter,
  map, startWith
} from 'rxjs/operators';
import {
  ThemeColors,
  ThemeSettings,
  ThemeType
} from '../models/settings/theme-settings.model';
import {TerminalSettingsService} from "./terminal-settings.service";

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentTheme?: ThemeType | null;

  private readonly darkThemeColors: ThemeColors = {
    sellColor: 'rgba(209, 38, 27, 1)',
    sellColorBackground: 'rgba(209, 38, 27, 0.4)',
    buyColor: 'rgba(0, 155, 99, 1)',
    buyColorBackground: 'rgba(0, 155, 99, 0.4)',
    componentBackground: '#141922',
    primaryColor: '#177ddc',
    purpleColor: '#51258f',
    errorColor: '#a61d24',
    chartGridColor: '#272E3B',
    chartLabelsColor: '#97A4BB',
    chartPrimaryTextColor: '#ffffff',
    chartBackground: '#1F2530'
  };

  private readonly lightThemeColors: ThemeColors = {
    sellColor: 'rgba(250, 79, 56, 1)',
    sellColorBackground: 'rgba(250, 79, 56, 0.4)',
    buyColor: '#388E3C',
    buyColorBackground: 'rgba(0, 219, 139, 0.4)',
    componentBackground: '#ffffff',
    primaryColor: '#177ddc',
    purpleColor: '#51258f',
    errorColor: '#a61d24',
    chartGridColor: '#D8E3F5',
    chartLabelsColor: '#647188',
    chartPrimaryTextColor: '#000000',
    chartBackground: '#F1F4F9'
  };

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly terminalSettings: TerminalSettingsService) {
  }

  subscribeToThemeChanges(): Subscription {
    return this.getThemeSettings().pipe(
      map(s => s.theme),
      startWith(ThemeType.dark)
    )
      .subscribe(theme => this.setTheme(theme));
  }

  getThemeSettings(): Observable<ThemeSettings> {
    return this.terminalSettings.getSettings().pipe(
      distinctUntilChanged((previous, current) => previous.designSettings?.theme === current.designSettings?.theme),
      map(x => x.designSettings?.theme ?? ThemeType.dark),
      map(x => ({
        theme: x,
        themeColors: x === ThemeType.dark ? this.darkThemeColors : this.lightThemeColors
      }))
    );
  }

  private setTheme(theme: ThemeType): void {
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

    document.head.prepend(style);

    return subj;
  }
}
