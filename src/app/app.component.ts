import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {APP_HOOK, AppHook} from "./shared/services/app-hook/app-hook-token";

@Component({
  selector: 'ats-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'astras';

  constructor(
    @Inject(APP_HOOK)
    private readonly appHooks: AppHook[]
  ) {
  }

  ngOnInit(): void {
    this.appHooks.forEach(x => {
      x.onInit();
    });

  }

  ngOnDestroy(): void {
    this.appHooks.forEach(x => {
      x.onDestroy();
    });
  }
}
