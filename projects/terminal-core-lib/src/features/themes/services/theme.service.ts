import {
  DestroyRef,
  inject,
  Injectable
} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
  startWith
} from 'rxjs';
import {TerminalSettingsService} from '../../terminal-settings/services/terminal-settings.service';
import {LocalStorageService} from '../../local-storage/local-storage.service';
import {DesignSettingsConstants} from '../../local-storage/local-storage.constants';
import {
  ThemeSettings,
  ThemeType
} from '../themes.types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Injectable({providedIn: 'root'})
export class ThemeService {
  private readonly terminalSettings = inject(TerminalSettingsService);

  private readonly localStorageService = inject(LocalStorageService);

  private readonly document = inject(DOCUMENT);

  private themeSettings$?: Observable<ThemeSettings>;

  private readonly currentTheme$: Observable<ThemeType> = this.terminalSettings.getSettings().pipe(
    map(s => s.designSettings?.theme),
    startWith(this.localStorageService.getStringItem(DesignSettingsConstants.LastThemeStorageKey) as ThemeType | null),
    map(v => v ?? ThemeType.dark),
    distinctUntilChanged(),
    shareReplay(1)
  )

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.currentTheme$.pipe(
      takeUntilDestroyed(destroyRef)
    ).subscribe(theme => {
      this.localStorageService.setStringItem(DesignSettingsConstants.LastThemeStorageKey, theme as string);
    })
  }

  getCurrentTheme(): Observable<ThemeType> {
    return this.currentTheme$;
  }

  getThemeSettings(): Observable<ThemeSettings> {
    if (!this.themeSettings$) {
      this.themeSettings$ = this.currentTheme$.pipe(
        map(t => {
          const styles = window.getComputedStyle(this.document.documentElement);
          const cssVar = (name: string): string => styles.getPropertyValue(name).trim();
          return {
            theme: t,
            themeColors: {
              sellColor: cssVar('--ats-sell-color'),
              sellColorBackground: cssVar('--ats-sell-color-background'),
              sellColorAccent: cssVar('--ats-sell-color-accent'),

              buyColor: cssVar('--ats-buy-color'),
              buyColorBackground: cssVar('--ats-buy-color-background'),
              buyColorAccent: cssVar('--ats-buy-color-accent'),
              buyColorBackgroundLight: cssVar('--ats-buy-color-background-light'),

              mixColor: cssVar('--ats-mix-color'),

              buySellBtnTextColor: cssVar('--ats-buy-sell-btn-text-color'),

              componentBackground: cssVar('--ats-component-background'),
              primaryColor: cssVar('--ats-primary-color'),
              errorColor: cssVar('--ats-error-color'),
              purpleColor: cssVar('--ats-purple-color'),
              textColor: cssVar('--ats-text-color'),

              chartGridColor: cssVar('--ats-chart-grid-color'),
              chartLabelsColor: cssVar('--ats-chart-labels-color'),
              chartPrimaryTextColor: cssVar('--ats-chart-primary-text-color'),
              chartShadow: cssVar('--ats-chart-shadow'),
              textMaxContrastColor: cssVar('--ats-text-max-contrast-color'),
              tableGridColor: cssVar('--ats-table-grid-color'),
            }
          }
        }),
        shareReplay({bufferSize: 1, refCount: true})
      );
    }

    return this.themeSettings$;
  }
}
