import { Injectable, inject } from "@angular/core";
import { Subscription } from "rxjs";
import {
  map,
  startWith
} from "rxjs/operators";
import { AreaHook } from "./area-hook-token";
import { ThemeService } from "../../theme.service";
import { TerminalSettingsService } from "../../terminal-settings.service";
import { LocalStorageService } from "../../local-storage.service";
import { DesignSettingsConstants } from "../../../constants/local-storage.constants";
import {
  FontFamilies,
  TerminalFontSize
} from "../../../models/terminal-settings/terminal-settings.model";

@Injectable()
export class ApplyDesignSettingsHook implements AreaHook {
  private readonly themeService = inject(ThemeService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly localStorageService = inject(LocalStorageService);

  private changesSubscription?: Subscription;
  private readonly defaultFontSize: TerminalFontSize = 100;

  onDestroy(): void {
    this.changesSubscription?.unsubscribe();
  }

  onInit(): void {
    this.changesSubscription = this.themeService.subscribeToThemeChanges();

    this.changesSubscription.add(
      this.terminalSettingsService.getSettings().pipe(
        map(s => ({
          fontFamily: s.designSettings?.fontFamily,
          fontSize: s.designSettings?.fontSize
        })),
        startWith({
          fontFamily: this.localStorageService.getStringItem(DesignSettingsConstants.LastFontStorageKey) as FontFamilies ?? FontFamilies.NotoSans,
          fontSize: this.toTerminalFontSize(
            Number(this.localStorageService.getStringItem(DesignSettingsConstants.LastFontSizeStorageKey) ?? this.defaultFontSize)
          )
        })
      ).subscribe(designSettings => {
        const fontFamily = designSettings.fontFamily ?? FontFamilies.NotoSans;
        const fontSize = designSettings.fontSize ?? this.defaultFontSize;

        const defaultFontFamilies = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial," +
          "  'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'," +
          "  'Noto Color Emoji'";

        document.body.style.fontFamily = `'${fontFamily}', ${defaultFontFamilies}`;
        document.documentElement.style.fontSize = `${fontSize}%`;
        this.localStorageService.setStringItem(DesignSettingsConstants.LastFontStorageKey, fontFamily);
        this.localStorageService.setStringItem(DesignSettingsConstants.LastFontSizeStorageKey, String(fontSize));
      })
    );
  }

  private toTerminalFontSize(value: number): TerminalFontSize {
    const allowedValues: TerminalFontSize[] = [100, 110, 120];
    return allowedValues.includes(value as TerminalFontSize) ? value as TerminalFontSize : this.defaultFontSize;
  }
}
