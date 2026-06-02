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
import {dashboardProviders} from '../../dashboard.providers';

const SHELL_INIT_HOOK = new InjectionToken<Hook[]>('SHELL_INIT_HOOK');

@Component({
  selector: 'atsm-dashboard-shell',
  imports: [
    NzSpinComponent,
    DashboardPage
  ],
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    dashboardProviders
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
