import {
  ChangeDetectionStrategy,
  computed,
  Component,
  DestroyRef,
  inject,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {
  Subscription,
  timer
} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  NzModalComponent,
  NzModalContentDirective
} from 'ng-zorro-antd/modal';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  NzResultComponent,
  NzResultExtraDirective
} from 'ng-zorro-antd/result';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  ContourActivationDialogMessage,
  ContourActivationDialogService
} from '../../services/contour-activation-dialog.service';
import {
  ContourActivationResultStatus,
  ContourErrorCode,
  ContourErrorResponse,
  SwitchCooldownErrorResponse
} from '../../types/contour-switch.types';

type ContourActivationResultViewStatus = 'warning' | 'error' | 'success';

@Component({
  selector: 'ats-contour-activation-dialog',
  imports: [
    NzModalComponent,
    NzModalContentDirective,
    NzButtonComponent,
    NzResultComponent,
    NzResultExtraDirective,
    TranslocoDirective
  ],
  templateUrl: './contour-activation-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ContourActivationDialog {
  protected readonly isVisible = signal(false);

  protected readonly message = signal(ContourActivationDialogMessage.TradingBlocked);

  protected readonly isActivationLoading = signal(false);

  protected readonly cooldownSeconds = signal<number | null>(null);

  protected readonly resultStatus = computed<ContourActivationResultViewStatus>(() => {
    if (this.cooldownSeconds() != null) {
      return 'error';
    }

    switch (this.message()) {
      case ContourActivationDialogMessage.ContourActivated:
        return 'success';
      case ContourActivationDialogMessage.TradingBlocked:
        return 'warning';
      default:
        return 'error';
    }
  });

  protected readonly isActionDisabled = computed(() =>
    this.isActivationLoading() ||
    this.cooldownSeconds() != null ||
    this.message() !== ContourActivationDialogMessage.TradingBlocked
  );

  protected readonly isActionVisible = computed(() =>
    this.message() !== ContourActivationDialogMessage.ContourActivated
  );

  private readonly dialogService = inject(ContourActivationDialogService);

  private readonly destroyRef = inject(DestroyRef);

  private cooldownSubscription?: Subscription;

  constructor() {
    this.dialogService.showDialog$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.showInitialBlockedDialog();
    });

    this.destroyRef.onDestroy(() => {
      this.cooldownSubscription?.unsubscribe();
    });
  }

  protected activateCurrentContour(): void {
    if (this.isActionDisabled()) {
      return;
    }

    this.cancelCooldown();
    this.isActivationLoading.set(true);

    this.dialogService.activateCurrentContour().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.isActivationLoading.set(false);

      if (result.status === ContourActivationResultStatus.Success) {
        this.cooldownSeconds.set(null);
        this.message.set(ContourActivationDialogMessage.ContourActivated);
        return;
      }

      this.handleActivationError(result.error);
    });
  }

  protected close(): void {
    this.isVisible.set(false);
  }

  private showInitialBlockedDialog(): void {
    this.cancelCooldown();
    this.message.set(ContourActivationDialogMessage.TradingBlocked);
    this.isActivationLoading.set(false);
    this.isVisible.set(true);
  }

  private handleActivationError(error: ContourErrorResponse | SwitchCooldownErrorResponse | null): void {
    switch (error?.code) {
      case ContourErrorCode.SwitchCooldown:
        this.startCooldown(this.isSwitchCooldownErrorResponse(error) ? error.retryAfterSec : 1);
        return;
      case ContourErrorCode.ContourSwitchDisabled:
        this.setDisabledState(ContourActivationDialogMessage.ActivationUnavailable);
        return;
      case ContourErrorCode.ContourStateUnavailable:
      case ContourErrorCode.ContourProjectionUnavailable:
        this.setDisabledState(ContourActivationDialogMessage.TradingUnavailable);
        return;
      default:
        this.setDisabledState(ContourActivationDialogMessage.ActivationFailed);
    }
  }

  private setDisabledState(message: ContourActivationDialogMessage): void {
    this.cancelCooldown();
    this.message.set(message);
  }

  private startCooldown(retryAfterSec: number): void {
    const initialSeconds = Math.max(1, Math.ceil(retryAfterSec));

    this.cancelCooldown();
    this.message.set(ContourActivationDialogMessage.TradingBlocked);
    this.cooldownSeconds.set(initialSeconds);

    this.cooldownSubscription = timer(1000, 1000).subscribe(() => {
      const currentSeconds = this.cooldownSeconds();

      if (currentSeconds == null) {
        return;
      }

      const nextSeconds = currentSeconds - 1;

      if (nextSeconds <= 0) {
        this.cancelCooldown();
        this.message.set(ContourActivationDialogMessage.TradingBlocked);
        return;
      }

      this.cooldownSeconds.set(nextSeconds);
    });
  }

  private cancelCooldown(): void {
    this.cooldownSubscription?.unsubscribe();
    this.cooldownSubscription = undefined;
    this.cooldownSeconds.set(null);
  }

  private isSwitchCooldownErrorResponse(error: ContourErrorResponse | SwitchCooldownErrorResponse | null): error is SwitchCooldownErrorResponse {
    return error?.code === ContourErrorCode.SwitchCooldown &&
      'retryAfterSec' in error &&
      typeof error.retryAfterSec === 'number';
  }
}
