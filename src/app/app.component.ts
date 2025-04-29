import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  Optional
} from '@angular/core';
import { GlobalLoadingIndicatorService } from "./shared/services/global-loading-indicator.service";
import { Observable } from "rxjs";
import {
  APP_HOOK,
  AppHook
} from "./shared/services/hook/app/app-hook-token";

@Component({
    selector: 'ats-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
    standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  readonly isLoading$: Observable<boolean>;

  constructor(
    @Inject(APP_HOOK) @Optional()
    private readonly appHooks: AppHook[] | null,
    globalLoadingIndicatorService: GlobalLoadingIndicatorService
  ) {
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
