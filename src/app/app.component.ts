import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Store } from '@ngrx/store';
import { initTerminalSettings } from './store/terminal-settings/terminal-settings.actions';
import { initWidgetSettings } from "./store/widget-settings/widget-settings.actions";
import { SessionTrackService } from "./shared/services/session/session-track.service";
import { initInstrumentsWithBadges } from "./store/instruments/instruments.actions";
import { ThemeService } from './shared/services/theme.service';
import { TerminalSettingsService } from './modules/terminal-settings/services/terminal-settings.service';
import { Subscription } from 'rxjs';
import { initPortfolios } from './store/portfolios/portfolios.actions';
import { map } from "rxjs/operators";
import { rusLangLocales } from "./shared/utils/translation-helper";
import { TranslocoService } from "@ngneat/transloco";
import { en_US, NzI18nService, ru_RU } from "ng-zorro-antd/i18n";

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
    private readonly translocoService: TranslocoService,
    private readonly nzI18nService: NzI18nService
  ) {
  }

  ngOnInit(): void {
    this.store.dispatch(initTerminalSettings());
    this.store.dispatch(initWidgetSettings());
    this.store.dispatch(initPortfolios());
    this.store.dispatch(initInstrumentsWithBadges());
    this.sessionTrackService.startTracking();

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
        this.translocoService.setActiveLang(lang);
        this.nzI18nService.setLocale(lang === 'en' ? en_US : ru_RU);
      });
  }

  ngOnDestroy(): void {
    this.sessionTrackService.stopTracking();

    this.themeChangeSubscription?.unsubscribe();
    this.langChangeSubscription?.unsubscribe();
  }
}
