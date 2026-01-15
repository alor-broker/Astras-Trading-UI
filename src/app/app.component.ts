import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {GlobalLoadingIndicatorService} from "./shared/services/global-loading-indicator.service";
import {Observable} from "rxjs";
import {APP_HOOK } from "./shared/services/hook/app/app-hook-token";
import {RouterOutlet} from '@angular/router';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  imports: [
    RouterOutlet,
    NzSpinComponent,
    AsyncPipe
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly appHooks = inject(APP_HOOK, { optional: true });

  readonly isLoading$: Observable<boolean>;

  constructor() {
    const globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);

    this.isLoading$ = globalLoadingIndicatorService.isLoading$;
  }

  ngOnInit(): void {
    this.executeHooks();
  }

  ngOnDestroy(): void {
    this.destroyHooks();
  }

  private executeHooks(): void {
    (this.appHooks ?? []).forEach(x => {
      x.onInit();
    });
  }

  private destroyHooks(): void {
    (this.appHooks ?? []).forEach(x => {
      x.onDestroy();
    });
  }
}
