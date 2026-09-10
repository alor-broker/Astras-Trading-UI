import {DecimalPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {TechnicalLevel} from '../../types/technical-analysis-view.types';

@Component({
  selector: 'ats-technical-price-levels',
  imports: [DecimalPipe, TranslocoDirective],
  templateUrl: './technical-price-levels.html',
  styleUrl: './technical-price-levels.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TechnicalPriceLevels {
  readonly levels = input.required<TechnicalLevel[]>();

  readonly currentPrice = input.required<number>();

  protected readonly rows = computed(() => {
    const price = this.currentPrice();
    if (!Number.isFinite(price) || price <= 0) {
      return [];
    }

    const points = this.levels().map(level => ({...level, delta: (level.price / price - 1) * 100}))
      .filter(point => Number.isFinite(point.delta));
    const extent = Math.max(0.01, ...points.map(point => Math.abs(point.delta)));
    return points.map(point => {
      const width = Math.abs(point.delta) / extent * 48;
      return {...point, width, left: point.delta < 0 ? 50 - width : 50};
    });
  });
}
