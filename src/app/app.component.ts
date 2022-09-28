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
import {
  ThemeService,
  ThemeType
} from './shared/services/theme.service';
import { TerminalSettingsService } from './modules/terminal-settings/services/terminal-settings.service';
import {
  Subject,
  takeUntil
} from 'rxjs';
import {
  distinct,
  map
} from 'rxjs/operators';

@Component({
  selector: 'ats-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'astras';
  private destroy$: Subject<boolean> = new Subject<boolean>();

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
    this.store.dispatch(initInstrumentsWithBadges());
    this.sessionTrackService.startTracking();

    this.terminalSettings.getSettings().pipe(
      map(x => x.designSettings?.theme ?? ThemeType.dark),
      distinct(),
      takeUntil(this.destroy$)
    ).subscribe(themeType => this.themeService.setTheme(themeType));
  }

  ngOnDestroy(): void {
    this.sessionTrackService.stopTracking();

    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
