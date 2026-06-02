import {ThemeService} from '../services/theme.service';
import {
  DOCUMENT,
  inject
} from '@angular/core';
import {Subscription} from 'rxjs';
import {ThemeType} from '../themes.types';
import {Hook} from '../../../common/types/hook.types';

export class ApplyThemeHook implements Hook {
  private readonly activeThemeLinkId = 'ats-active-theme';

  private readonly themeLinkSelector = 'link[rel="stylesheet"]';

  private subscription?: Subscription;

  private readonly document = inject(DOCUMENT);

  private readonly themeService = inject(ThemeService);

  onInit(): void {
    this.subscription = this.themeService.getCurrentTheme()
      .subscribe(theme => {
        this.applyTheme(theme);
      });
  }

  onDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private applyTheme(theme: ThemeType): void {
    const activeLinkEl = this.getThemeLink(theme) ?? this.createThemeLink(theme);

    this.getThemeLinks().forEach(linkEl => {
      const isActiveTheme = linkEl === activeLinkEl;
      linkEl.disabled = !isActiveTheme;

      if (isActiveTheme) {
        linkEl.id = this.activeThemeLinkId;
        linkEl.dataset['atsTheme'] = theme;
      } else if (linkEl.id === this.activeThemeLinkId) {
        linkEl.removeAttribute('id');
      }
    });
  }

  private createThemeLink(theme: ThemeType): HTMLLinkElement {
    const linkEl = this.document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = this.getThemeHref(theme);
    linkEl.dataset['atsTheme'] = theme;
    this.insertThemeLink(linkEl);

    return linkEl;
  }

  private getThemeLink(theme: ThemeType): HTMLLinkElement | null {
    const activeLinkEl = this.document.getElementById(this.activeThemeLinkId);

    if (activeLinkEl instanceof HTMLLinkElement && this.isThemeLink(activeLinkEl, theme)) {
      return activeLinkEl;
    }

    return this.getThemeLinks().find(linkEl => this.isThemeLink(linkEl, theme)) ?? null;
  }

  private getThemeLinks(): HTMLLinkElement[] {
    return Array.from(this.document.head.querySelectorAll<HTMLLinkElement>(this.themeLinkSelector))
      .filter(linkEl => this.isThemeLink(linkEl));
  }

  private insertThemeLink(linkEl: HTMLLinkElement): void {
    const defaultThemeLink = this.getThemeLink(ThemeType.dark);

    // dark-theme is linked manually in index.html before app bootstrap.
    // New theme links must stay near it to keep framework styles available as early as possible.
    if (defaultThemeLink != null) {
      defaultThemeLink.after(linkEl);
      return;
    }

    this.document.head.insertBefore(linkEl, this.getFirstStylesheetLink());
  }

  private getFirstStylesheetLink(): HTMLLinkElement | null {
    return this.document.head.querySelector<HTMLLinkElement>(this.themeLinkSelector);
  }

  private isThemeLink(linkEl: HTMLLinkElement, theme?: ThemeType): boolean {
    const dataTheme = linkEl.dataset['atsTheme'] as ThemeType | undefined;

    if (theme == null && (dataTheme === ThemeType.dark || dataTheme === ThemeType.default)) {
      return true;
    }

    if (theme != null && dataTheme === theme) {
      return true;
    }

    const themeNames = theme == null
      ? ['dark-theme', 'light-theme']
      : [this.getThemeName(theme)];

    return themeNames.some(themeName => linkEl.href.includes(themeName));
  }

  private getThemeName(theme: ThemeType): string {
    return theme === ThemeType.dark ? 'dark-theme' : 'light-theme';
  }

  private getThemeHref(theme: ThemeType): string {
    return `${this.getThemeName(theme)}.css`;
  }
}
