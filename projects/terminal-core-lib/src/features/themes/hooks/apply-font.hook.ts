import {Hook} from '../../../common/types/hook.types';
import {
  DOCUMENT,
  inject,
  Injectable
} from '@angular/core';
import {TerminalSettingsService} from '../../terminal-settings/services/terminal-settings.service';
import {LocalStorageService} from '../../local-storage/local-storage.service';
import {DesignSettingsConstants} from '../../local-storage/local-storage.constants';
import {
  distinctUntilChanged,
  map,
  startWith,
  Subscription
} from 'rxjs';
import {FontFamilies} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';

const FONT_LINK_ID = 'ats-active-font';
const GOOGLE_FONTS_BASE_URL = 'https://fonts.googleapis.com/css2';

@Injectable()
export class ApplyFontHook implements Hook {
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly localStorageService = inject(LocalStorageService);

  private readonly document = inject(DOCUMENT);

  private subscription?: Subscription;

  private activeLinkEl: HTMLLinkElement | null = null;

  onInit(): void {
    this.subscription = this.terminalSettingsService.getSettings()
      .pipe(
        map(s => s.designSettings?.fontFamily ?? null),
        startWith(this.localStorageService.getStringItem(DesignSettingsConstants.LastFontStorageKey)),
        map(fontFamily => this.toFontFamily(fontFamily) ?? FontFamilies.NotoSans),
        distinctUntilChanged()
      )
      .subscribe(fontFamily => {
        this.applyFont(fontFamily);
      });
  }

  onDestroy(): void {
    this.subscription?.unsubscribe();
    this.removeFontLink();
    this.document.documentElement.style.fontFamily = '';
  }

  private applyFont(fontFamily: FontFamilies | null): void {
    if (fontFamily == null) {
      this.removeFontLink();
      this.document.documentElement.style.fontFamily = '';
      return;
    }

    this.localStorageService.setStringItem(DesignSettingsConstants.LastFontStorageKey, fontFamily);

    if (fontFamily !== FontFamilies.NotoSans) {
      // FontFamilies.NotoSerif included into index.html
      this.loadGoogleFont(fontFamily);
    }

    const defaultFontFamilies = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial," +
      "  'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'," +
      "  'Noto Color Emoji'";

    this.document.body.style.fontFamily = `"${fontFamily}", ${defaultFontFamilies}`;
  }

  private loadGoogleFont(fontFamily: FontFamilies): void {
    this.removeFontLink();

    const encodedFamily = encodeURIComponent(fontFamily);
    const href = `${GOOGLE_FONTS_BASE_URL}?family=${encodedFamily}:wght@300;400;500;600;700&display=swap`;

    const linkEl = this.document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = href;
    linkEl.id = FONT_LINK_ID;
    this.document.head.appendChild(linkEl);
    this.activeLinkEl = linkEl;
  }

  private toFontFamily(fontFamily: string | null): FontFamilies | null {
    if (fontFamily == null) {
      return null;
    }

    return (Object.values(FontFamilies) as string[]).includes(fontFamily)
      ? fontFamily as FontFamilies
      : null;
  }

  private removeFontLink(): void {
    if (this.activeLinkEl) {
      this.activeLinkEl.remove();
      this.activeLinkEl = null;
    }
  }
}
