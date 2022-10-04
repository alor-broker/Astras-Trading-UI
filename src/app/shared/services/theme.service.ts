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
  map
} from 'rxjs/operators';
import { TerminalSettingsService } from '../../modules/terminal-settings/services/terminal-settings.service';
import {
  ThemeColors,
  ThemeSettings,
  ThemeType
} from '../models/settings/theme-settings.model';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentTheme?: ThemeType | null;

  private readonly darkThemeColors: ThemeColors = {
    sellColor: 'rgba(184, 27, 68, 1)',
    sellColorBackground: 'rgba(184, 27, 68, 0.4)',
    buyColor: 'rgba(12, 179, 130, 1)',
    buyColorBackground: 'rgba(12, 179, 130, 0.4)',
    componentBackground: '#141414',
    primaryColor: '#177ddc',
    purpleColor: '#51258f',
    errorColor: '#a61d24',
    chartGridColor: '#444',
    chartLabelsColor: '#fff'
  };

  private readonly lightThemeColors: ThemeColors = {
    sellColor: 'rgba(239,83,80, 1)',
    sellColorBackground: 'rgba(239,83,80, 0.4)',
    buyColor: 'rgba(38,166,154, 1)',
    buyColorBackground: 'rgba(38,166,154, 0.4)',
    componentBackground: '#ffffff',
    primaryColor: '#177ddc',
    purpleColor: '#51258f',
    errorColor: '#a61d24',
    chartGridColor: '#f0f0f0',
    chartLabelsColor: '#000'
  };

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly terminalSettings: TerminalSettingsService) {
  }

  subscribeToThemeChanges(): Subscription {
    return this.getThemeSettings()
      .subscribe(settings => this.setTheme(settings.theme));
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

    document.head.append(style);

    return subj;
  }
}
