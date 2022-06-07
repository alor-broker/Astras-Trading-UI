import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { initTerminalSettings } from './store/terminal-settings/terminal-settings.actions';

@Component({
  selector: 'ats-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit {
  title = 'astras';

  constructor(
    private readonly store: Store
  ) {
  }

  ngOnInit(): void {
    this.store.dispatch(initTerminalSettings());
  }
}
