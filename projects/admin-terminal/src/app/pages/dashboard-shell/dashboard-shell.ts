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
import {Hook,} from '@terminal-core-lib/common/types/hook.types';
import {ApplyThemeHook} from '@terminal-core-lib/features/themes/hooks/apply-theme.hook';
import {dashboardProviders} from '../../dashboard.providers';
import {RouterOutlet} from '@angular/router';

const SHELL_INIT_HOOK = new InjectionToken<Hook[]>('SHELL_INIT_HOOK');

@Component({
  selector: 'atsd-dashboard-shell',
  imports: [
    NzSpinComponent,
    RouterOutlet
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

  private readonly shellHooks = inject(SHELL_INIT_HOOK, {optional: true});

  ngOnInit(): void {
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
}
