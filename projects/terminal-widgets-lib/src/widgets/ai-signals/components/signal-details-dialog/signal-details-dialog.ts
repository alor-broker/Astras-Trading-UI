import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  TemplateRef,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {map} from 'rxjs';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {injectFloatingWindowRef} from '@terminal-core-lib/features/floating-window/services/floating-window-ref';
import {FloatingWindowTemplateContext} from '@terminal-core-lib/features/floating-window/types/floating-window.types';
import {SignalDetailsWindowData} from '../../types/signal-details-window.types';
import {SignalOrderHelper} from '../../utils/signal-order.helper';
import {SignalSummaryViewHelper} from '../../utils/signal-summary-view.helper';
import {SignalDetailsService} from '../../services/signal-details.service';
import {signalDetailsProviders} from '../../services/signal-details.providers';
import {SignalAnalysisDetails} from '../signal-analysis-details/signal-analysis-details';
import {SignalSummary} from '../signal-summary/signal-summary';
import {SignalDisclaimer} from '../signal-disclaimer/signal-disclaimer';

@Component({
  selector: 'ats-signal-details-dialog',
  providers: signalDetailsProviders,
  imports: [
    TranslocoDirective,
    NzButtonComponent,
    NzIconDirective,
    SignalAnalysisDetails,
    SignalDisclaimer,
    SignalSummary
  ],
  templateUrl: './signal-details-dialog.html',
  styleUrl: './signal-details-dialog.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignalDetailsDialog {
  private readonly windowRef = injectFloatingWindowRef<SignalDetailsWindowData>();
  readonly displaySignal = computed(() => this.windowRef.closed() ? null : this.windowRef.data().signal);

  private readonly title = viewChild<TemplateRef<FloatingWindowTemplateContext<SignalDetailsWindowData>>>('title');
  private readonly footer = viewChild<TemplateRef<FloatingWindowTemplateContext<SignalDetailsWindowData>>>('footer');

  private readonly analysisExpanded = linkedSignal({source: this.displaySignal, computation: () => false});

  private readonly submitOrderContext = computed(() => this.windowRef.data().submitOrderContext);

  private readonly orderParams = computed(() => SignalOrderHelper.toSubmitOrderParams(this.displaySignal()));

  protected readonly canTrade = computed(() => this.submitOrderContext() != null && this.orderParams() != null);

  private readonly isMobile = toSignal(inject(DeviceService).deviceInfo$.pipe(
    map(deviceInfo => deviceInfo.isMobile)
  ), {initialValue: false});

  constructor() {
    effect(() => {
      const title = this.title();
      const footer = this.footer();
      this.windowRef.update({title, footer: footer ?? null, fullScreen: this.isMobile()});
    });
  }

  protected readonly details = toSignal(
    inject(SignalDetailsService).getDetails(toObservable(this.displaySignal)),
    {initialValue: null}
  );

  protected readonly hasSummary = computed(() => SignalSummaryViewHelper.hasSummary(this.details()));

  protected readonly analysisDetailsVisible = computed(() => {
    const displaySignal = this.displaySignal();

    return displaySignal != null && this.analysisExpanded();
  });

  protected showAnalysisDetails(): void {
    this.analysisExpanded.set(true);
  }

  protected submitOrder(): void {
    const params = this.orderParams();
    const context = this.submitOrderContext();
    if (params == null || context == null) {
      return;
    }

    this.close();
    context.submitOrder(params);
  }

  protected close(): void {
    this.analysisExpanded.set(false);
    this.windowRef.close();
  }
}
