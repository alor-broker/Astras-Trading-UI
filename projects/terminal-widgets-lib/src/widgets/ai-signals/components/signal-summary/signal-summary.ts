import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  SignalDirection
} from '../../services/ai-signals-service.types';
import {SignalSummaryViewModel} from '../../types/ai-signals-view.types';
import {SignalSummaryViewHelper} from '../../utils/signal-summary-view.helper';
import {TradePlanChart} from '../trade-plan-chart/trade-plan-chart';
import {SignalSection} from '../signal-section/signal-section';
import {SignalOverview} from '../signal-overview/signal-overview';
import {SignalRiskNotes} from '../signal-risk-notes/signal-risk-notes';

@Component({
  selector: 'ats-signal-summary',
  imports: [
    SignalSection,
    TranslocoDirective,
    TradePlanChart,
    SignalRiskNotes,
    SignalOverview
  ],
  templateUrl: './signal-summary.html',
  styleUrl: './signal-summary.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignalSummary {
  readonly details = input.required<SignalSummaryViewModel>();

  readonly compactTradePlan = input(false);

  protected readonly directions = SignalDirection;

  protected readonly hasRiskInfo = computed(() => SignalSummaryViewHelper.hasRiskInfo(this.details()));

  protected readonly hasOverview = computed(() => SignalSummaryViewHelper.hasOverview(this.details()));
}
