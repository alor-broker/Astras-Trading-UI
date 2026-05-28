import {
  ChangeDetectionStrategy,
  Component,
  inject,
  InjectionToken,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {toSignal} from '@angular/core/rxjs-interop';
import {GlobalLoadingIndicatorService} from '@terminal-core-lib/common/services/global-loading-indicator.service';
import {DashboardPage} from '../dashboard-page/dashboard-page';
import {Hook,} from '@terminal-core-lib/common/types/hook.types';
import {ApplyThemeHook} from '@terminal-core-lib/features/themes/hooks/apply-theme.hook';
import {dashboardProviders} from '../../dashboard.providers';
import {take} from 'rxjs';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';

const SHELL_INIT_HOOK = new InjectionToken<Hook[]>('SHELL_INIT_HOOK');
const MOBILE_TERMINAL_PATH = '/mobile';
const MOBILE_REDIRECT_TARGET_STORAGE_KEY = 'atsd-mobile-redirect-target';

@Component({
  selector: 'atsd-dashboard-shell',
  imports: [
    NzSpinComponent,
    DashboardPage
  ],
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    dashboardProviders,
    {
      provide: SHELL_INIT_HOOK,
      useClass: ApplyThemeHook,
      multi: true
    },
  ],
})
export class DashboardShell implements OnInit, OnDestroy {
  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);

  protected readonly isLoading = toSignal(
    this.globalLoadingIndicatorService.isLoading$
  );

  private readonly deviceService = inject(DeviceService);

  private readonly window = inject(Window);

  private readonly shellHooks = inject(SHELL_INIT_HOOK, {optional: true});

  ngOnInit(): void {
    this.deviceService.deviceInfo$.pipe(
      take(1)
    ).subscribe(deviceInfo => {
      if (deviceInfo.isMobile) {
        this.redirectToMobileTerminal();
      }
    });
    this.executeHooks();
  }

  ngOnDestroy(): void {
    this.destroyHooks();
  }

  private executeHooks(): void {
    (this.shellHooks ?? []).forEach(x => {
      x.onInit();
    });
  }

  private destroyHooks(): void {
    (this.shellHooks ?? []).forEach(x => {
      x.onDestroy();
    });
  }

  private redirectToMobileTerminal(): void {
    const currentUrl = this.window.location.href;
    const targetUrl = `${this.window.location.origin}${MOBILE_TERMINAL_PATH}`;

    if (this.isMobileTerminalPath(this.window.location.pathname)) {
      this.logMobileRedirectError(currentUrl, targetUrl);
      return;
    }

    try {
      if (this.window.sessionStorage.getItem(MOBILE_REDIRECT_TARGET_STORAGE_KEY) === targetUrl) {
        this.logMobileRedirectError(currentUrl, targetUrl);
        return;
      }

      this.window.sessionStorage.setItem(MOBILE_REDIRECT_TARGET_STORAGE_KEY, targetUrl);
    } catch {
      this.logMobileRedirectError(currentUrl, targetUrl);
      return;
    }

    this.window.location.assign(targetUrl);
  }

  private isMobileTerminalPath(pathname: string): boolean {
    return pathname === MOBILE_TERMINAL_PATH || pathname.startsWith(`${MOBILE_TERMINAL_PATH}/`);
  }

  private logMobileRedirectError(currentUrl: string, targetUrl: string): void {
    console.error('Mobile terminal redirect was blocked to prevent an infinite redirect loop.', {
      currentUrl,
      targetUrl
    });
  }
}
