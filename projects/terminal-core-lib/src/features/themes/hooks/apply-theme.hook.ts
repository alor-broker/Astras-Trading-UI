import {ThemeService} from '../services/theme.service';
import {
  DOCUMENT,
  inject
} from '@angular/core';
import {Subscription} from 'rxjs';
import {ThemeType} from '../themes.types';
import {Hook} from '../../../common/types/hook.types';

export class ApplyThemeHook implements Hook {
  private subscription?: Subscription;

  private activeLinkEl: HTMLLinkElement | null = null;

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
    const themeName = theme === ThemeType.dark ? 'dark-theme' : 'light-theme';
    const href = `${themeName}.css`;

    // Remove old theme link if exists
    if (this.activeLinkEl) {
      this.activeLinkEl.remove();
    }

    // Create and append new theme link
    const linkEl = this.document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = href;
    linkEl.id = 'ats-active-theme';
    this.document.head.appendChild(linkEl);
    this.activeLinkEl = linkEl;
  }
}
