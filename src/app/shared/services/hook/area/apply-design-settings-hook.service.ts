import {
  Inject,
  Injectable
} from "@angular/core";
import { Subscription } from "rxjs";
import {
  map,
  startWith
} from "rxjs/operators";
import { DOCUMENT } from "@angular/common";
import { AreaHook } from "./area-hook-token";
import { ThemeService } from "../../theme.service";
import { TerminalSettingsService } from "../../terminal-settings.service";
import { LocalStorageService } from "../../local-storage.service";
import { DesignSettingsConstants } from "../../../constants/local-storage.constants";
import { FontFamilies } from "../../../models/terminal-settings/terminal-settings.model";

@Injectable()
export class ApplyDesignSettingsHook implements AreaHook {
  private changesSubscription?: Subscription;

  constructor(
    private readonly themeService: ThemeService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly localStorageService: LocalStorageService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
  }

  onDestroy(): void {
    this.changesSubscription?.unsubscribe();
  }

  onInit(): void {
    this.changesSubscription = this.themeService.subscribeToThemeChanges();

    this.changesSubscription.add(
      this.terminalSettingsService.getSettings().pipe(
        map(s => s.designSettings?.fontFamily),
        startWith(this.localStorageService.getStringItem(DesignSettingsConstants.LastFontStorageKey) as FontFamilies ?? FontFamilies.NotoSans)
      ).subscribe(fontFamily => {
        if (fontFamily == null) {
          return;
        }

        const defaultFontFamilies = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial," +
          "  'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'," +
          "  'Noto Color Emoji'";

        document.body.style.fontFamily = `'${fontFamily}', ${defaultFontFamilies}`;
        this.localStorageService.setStringItem(DesignSettingsConstants.LastFontStorageKey, fontFamily);
      })
    );
  }
}
