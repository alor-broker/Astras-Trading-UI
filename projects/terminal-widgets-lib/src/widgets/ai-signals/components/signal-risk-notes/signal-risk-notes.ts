import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {RiskLevel} from '../../services/ai-signals-service.types';
import {SignalSection} from '../signal-section/signal-section';

@Component({
  selector: 'ats-signal-risk-notes',
  imports: [
    SignalSection,
    TranslocoDirective,
    NzTagComponent,
    NzTooltipDirective
  ],
  templateUrl: './signal-risk-notes.html',
  styleUrl: './signal-risk-notes.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignalRiskNotes {
  readonly newsRisk = input<RiskLevel | null>(null);

  readonly gapRisk = input<RiskLevel | null>(null);

  readonly avoidReasons = input<readonly string[]>([]);

  protected readonly riskLevels = RiskLevel;

  protected readonly scaleSteps = [1, 2, 3];

  private readonly levelScores: Record<RiskLevel, number> = {
    [RiskLevel.Low]: 1,
    [RiskLevel.Medium]: 2,
    [RiskLevel.High]: 3
  };

  protected readonly riskItems = computed(() => [
    {labelKey: 'newsRisk', level: this.newsRisk()},
    {labelKey: 'gapRisk', level: this.gapRisk()}
  ].flatMap(item => item.level == null
? []
: [{
    ...item,
    level: item.level,
    score: this.levelScores[item.level]
  }]));
}
