import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzAlertComponent} from 'ng-zorro-antd/alert';
import {
  SignalDetailsViewModel,
  SignalRowStatus
} from '../../types/ai-signals-view.types';
import {SignalAnalysts} from '../signal-analysts/signal-analysts';
import {SignalFundamental} from '../signal-fundamental/signal-fundamental';
import {SignalNewsSummary} from '../signal-news-summary/signal-news-summary';
import {SignalTechnicalAnalysis} from '../signal-technical-analysis/signal-technical-analysis';

@Component({
  selector: 'ats-signal-analysis-details',
  imports: [
    TranslocoDirective,
    NzAlertComponent,
    SignalAnalysts,
    SignalFundamental,
    SignalNewsSummary,
    SignalTechnicalAnalysis
  ],
  templateUrl: './signal-analysis-details.html',
  styleUrl: './signal-analysis-details.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignalAnalysisDetails {
  readonly details = input.required<SignalDetailsViewModel>();

  protected readonly rowStatuses = SignalRowStatus;
}
