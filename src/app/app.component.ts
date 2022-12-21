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
    private readonly themeService: ThemeService
  ) {
  }

  ngOnInit(): void {
    this.store.dispatch(initTerminalSettings());
    this.store.dispatch(initWidgetSettings());
    this.store.dispatch(initPortfolios());
    this.store.dispatch(initInstrumentsWithBadges());
    this.sessionTrackService.startTracking();

    this.themeChangeSubscription = this.themeService.subscribeToThemeChanges();
    this.langChangeSubscription = this.terminalSettings.subscribeToLangChanges();
  }

  ngOnDestroy(): void {
    this.sessionTrackService.stopTracking();

    this.themeChangeSubscription?.unsubscribe();
    this.langChangeSubscription?.unsubscribe();
  }
}
