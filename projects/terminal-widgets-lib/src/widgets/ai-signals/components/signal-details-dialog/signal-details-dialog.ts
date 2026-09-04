import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzModalComponent} from 'ng-zorro-antd/modal';
import {map} from 'rxjs';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {SignalRowViewModel} from '../../types/ai-signals-view.types';
import {SignalSummaryViewHelper} from '../../utils/signal-summary-view.helper';
import {SignalDetailsService} from '../../services/signal-details.service';
import {signalDetailsProviders} from '../../services/signal-details.providers';
import {SignalAnalysisDetails} from '../signal-analysis-details/signal-analysis-details';
import {SignalSummary} from '../signal-summary/signal-summary';

@Component({
  selector: 'ats-signal-details-dialog',
  providers: signalDetailsProviders,
  imports: [
    AsyncPipe,
    TranslocoDirective,
    NzButtonComponent,
    NzIconDirective,
    NzModalComponent,
    SignalAnalysisDetails,
    SignalSummary
  ],
  templateUrl: './signal-details-dialog.html',
  styleUrl: './signal-details-dialog.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignalDetailsDialog {
  readonly displaySignal = model<SignalRowViewModel | null>(null);

  private readonly expandedSignal = signal<SignalRowViewModel | null>(null);

  private readonly ordersDialogService = inject(OrdersDialogService);

  protected readonly isOrderDialogSupported = this.ordersDialogService.dialogOptions.isNewOrderDialogSupported;

  protected readonly canParticipate = computed(() => this.isOrderDialogSupported && this.displaySignal()?.exchange != null);

  protected readonly isMobile$ = inject(DeviceService).deviceInfo$.pipe(
    map(deviceInfo => deviceInfo.isMobile)
  );

  protected readonly details = toSignal(
    inject(SignalDetailsService).getDetails(toObservable(this.displaySignal)),
    {initialValue: null}
  );

  protected readonly hasSummary = computed(() => SignalSummaryViewHelper.hasSummary(this.details()));

  protected readonly analysisDetailsVisible = computed(() => {
    const displaySignal = this.displaySignal();

    return displaySignal != null && this.expandedSignal() === displaySignal;
  });

  protected showAnalysisDetails(): void {
    this.expandedSignal.set(this.displaySignal());
  }

  protected openOrderDialog(): void {
    const signal = this.displaySignal();
    if (signal?.exchange == null || !this.isOrderDialogSupported) {
      return;
    }

    this.ordersDialogService.openNewOrderDialog({
      instrumentKey: InstrumentKeyHelper.toInstrumentKey({
        symbol: signal.ticker,
        exchange: signal.exchange
      }),
      initialValues: {}
    });
  }

  protected close(): void {
    this.expandedSignal.set(null);
    this.displaySignal.set(null);
  }
}
