import {DecimalPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTooltipModule} from 'ng-zorro-antd/tooltip';
import {TechnicalGaugeKind} from '../../types/technical-analysis-view.types';

@Component({
  selector: 'ats-technical-indicator-gauge',
  imports: [DecimalPipe, TranslocoDirective, NzTooltipModule],
  templateUrl: './technical-indicator-gauge.html',
  styleUrl: './technical-indicator-gauge.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TechnicalIndicatorGauge {
  readonly kind = input.required<TechnicalGaugeKind>();

  readonly value = input.required<number | null>();

  protected readonly isStrength = computed(() => this.kind() === TechnicalGaugeKind.Adx);

  protected readonly thresholds = computed(() => this.isStrength()
    ? {low: 20, high: 25}
    : this.kind() === TechnicalGaugeKind.Rsi ? {low: 30, high: 70} : {low: 20, high: 80});

  protected readonly validValue = computed(() => {
    const value = this.value();
    return value != null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
  });

  protected readonly status = computed(() => {
    const value = this.validValue();
    if (value == null) {
      return 'unavailable';
    }

    const {low, high} = this.thresholds();
    return this.isStrength()
      ? value < low ? 'weak' : value > high ? 'strong' : 'moderate'
      : value < low ? 'oversold' : value > high ? 'overbought' : 'neutral';
  });
}
