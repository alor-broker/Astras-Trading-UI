import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Store } from '@ngrx/store';
import { initTerminalSettings } from './store/terminal-settings/terminal-settings.actions';
import { SessionTrackService } from "./shared/services/session/session-track.service";

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
    this.sessionTrackService.startTracking();
  }

  ngOnDestroy(): void {
    this.sessionTrackService.stopTracking();
  }
}
