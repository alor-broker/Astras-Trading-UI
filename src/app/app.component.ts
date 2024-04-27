import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { APP_HOOK, AppHook } from "./shared/services/app-hook/app-hook-token";
import { GlobalLoadingIndicatorService } from "./shared/services/global-loading-indicator.service";
import { Observable } from "rxjs";

@Component({
  selector: 'ats-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements OnInit, OnDestroy {
  readonly isLoading$: Observable<boolean>;

  constructor(
    @Inject(APP_HOOK)
    private readonly appHooks: AppHook[],
    globalLoadingIndicatorService: GlobalLoadingIndicatorService
  ) {
    this.isLoading$ = globalLoadingIndicatorService.isLoading$;
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
