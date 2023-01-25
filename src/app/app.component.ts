import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Store } from '@ngrx/store';
import { initTerminalSettings } from './store/terminal-settings/terminal-settings.actions';
import { SessionTrackService } from "./shared/services/session/session-track.service";
import { ThemeService } from './shared/services/theme.service';
import { TerminalSettingsService } from './modules/terminal-settings/services/terminal-settings.service';
import { Subscription } from 'rxjs';
import { map } from "rxjs/operators";
import { rusLangLocales } from "./shared/utils/translation-helper";
import { en_US, NzI18nService, ru_RU } from "ng-zorro-antd/i18n";
import { TranslatorService } from "./shared/services/translator.service";

@Component({
  selector: 'ats-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'astras';

  private themeChangeSubscription?: Subscription;
  private langChangeSubscription?: Subscription;

  constructor(
    private readonly store: Store,
    private readonly sessionTrackService: SessionTrackService,
    private readonly terminalSettings: TerminalSettingsService,
    private readonly themeService: ThemeService,
    private readonly translatorService: TranslatorService,
    private readonly nzI18nService: NzI18nService
  ) {
  }

  ngOnInit(): void {
    this.sessionTrackService.startTracking();

    this.store.dispatch(initTerminalSettings());
    this.themeChangeSubscription = this.themeService.subscribeToThemeChanges();
    this.langChangeSubscription = this.terminalSettings.getSettings()
      .pipe(
        map(settings => {
          if (settings.language) {
            return settings.language;
          }
          if (rusLangLocales.includes(navigator.language.toLowerCase())) {
            return 'ru';
          }
          return 'en';
        })
      )
      .subscribe(lang => {
        this.translatorService.setActiveLang(lang);
        this.nzI18nService.setLocale(lang === 'en' ? en_US : ru_RU);
      });
  }

  ngOnDestroy(): void {
    this.sessionTrackService.stopTracking();

    this.themeChangeSubscription?.unsubscribe();
    this.langChangeSubscription?.unsubscribe();
  }
}
