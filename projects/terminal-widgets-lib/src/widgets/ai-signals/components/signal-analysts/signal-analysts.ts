import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  AnalystViewModel,
  SignalSummaryViewModel
} from '../../types/ai-signals-view.types';
import {SignalSummary} from '../signal-summary/signal-summary';
import {TradePlanComparison} from '../trade-plan-comparison/trade-plan-comparison';
import {SignalSection} from '../signal-section/signal-section';
import {SignalSummaryViewHelper} from '../../utils/signal-summary-view.helper';

@Component({
  selector: 'ats-signal-analysts',
  imports: [
    SignalSection,
    TranslocoDirective,
    SignalSummary,
    TradePlanComparison
  ],
  templateUrl: './signal-analysts.html',
  styleUrl: './signal-analysts.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignalAnalysts {
  readonly analysts = input.required<readonly AnalystViewModel[]>();

  readonly consensus = input.required<SignalSummaryViewModel>();

  protected readonly opinions = computed(() => this.analysts().map(analyst => ({
    analyst,
    hasSummary: SignalSummaryViewHelper.hasSummary(analyst)
  })));
}
