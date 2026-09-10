import {DecimalPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzProgressComponent} from 'ng-zorro-antd/progress';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {
  SignalAction,
  SignalDirection
} from '../../services/ai-signals-service.types';
import {SignalOverviewViewModel} from '../../types/ai-signals-view.types';

@Component({
  selector: 'ats-signal-overview',
  imports: [DecimalPipe, TranslocoDirective, NzIconDirective, NzProgressComponent, NzTooltipDirective],
  templateUrl: './signal-overview.html',
  styleUrl: './signal-overview.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.compact]': 'compact()'
  }
})
export class SignalOverview {
  readonly details = input.required<SignalOverviewViewModel>();

  readonly showAction = input(true);

  readonly compact = input(false);

  protected readonly confidenceSize = computed(() => this.compact() ? 48 : 64);

  protected readonly directions = SignalDirection;

  protected readonly actions = SignalAction;

  protected readonly directionIcon = computed(() => {
    switch (this.details().direction) {
      case SignalDirection.Bullish:
        return 'rise';
      case SignalDirection.Bearish:
        return 'fall';
      default:
        return 'minus';
    }
  });

  protected readonly confidencePercent = computed(() => (this.details().confidence ?? 0) * 10);

  protected readonly confidenceColor = computed(() => {
    const confidence = this.details().confidence;

    if (confidence == null || confidence < 5) {
      return 'var(--ats-error-color)';
    }

    return confidence > 6
      ? 'var(--ats-success-color)'
      : 'var(--ats-warning-color)';
  });

  protected readonly confidenceFormat = (): string => {
    const confidence = this.details().confidence;

    return confidence == null
      ? ''
      : `${confidence}/10`;
  };

  protected readonly actionTooltipKey = computed(() => {
    const action = this.details().action;

    return action == null
      ? null
      : `actionTooltips.${action}`;
  });
}
