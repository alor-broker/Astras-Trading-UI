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

@Component({
  selector: 'ats-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'astras';

  constructor(
    private readonly store: Store,
    private readonly sessionTrackService: SessionTrackService
  ) {
  }

  ngOnInit(): void {
    this.store.dispatch(initTerminalSettings());
    this.store.dispatch(initWidgetSettings());
    this.store.dispatch(initInstrumentsWithBadges());
    this.sessionTrackService.startTracking();
  }

  ngOnDestroy(): void {
    this.sessionTrackService.stopTracking();
  }
}
