import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {AtsPrice} from '@terminal-core-lib/common/pipes/price';
import {
  TradePlanPriceRange,
  TradePlanViewModel
} from '../../types/ai-signals-view.types';

import {TradePlanLevel, TradePlanValue as ValueRowViewModel} from '../../types/trade-plan-level.types';
import {TradePlanViewHelper} from '../../utils/trade-plan-view.helper';
import {TradePlanMarker} from '../trade-plan-marker/trade-plan-marker';

interface PriceLevelViewModel {
  labelKey: TradePlanLevel;
  tooltipKey: string;
  value: number;
  positionPercent: number;
}

interface LegendRowViewModel {
  levels: ValueRowViewModel[];
}

interface PlanRangeViewModel {
  leftPercent: number;
  widthPercent: number;
}

interface PlanScaleViewModel {
  bounds: TradePlanPriceRange;
  levels: PriceLevelViewModel[];
  riskRange: PlanRangeViewModel | null;
  rewardRange: PlanRangeViewModel | null;
  optimisticRange: PlanRangeViewModel | null;
}

@Component({
  selector: 'ats-trade-plan-chart',
  imports: [
    TranslocoDirective,
    NzTooltipDirective,
    AtsPrice,
    TradePlanMarker
  ],
  templateUrl: './trade-plan-chart.html',
  styleUrl: './trade-plan-chart.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradePlanChart {
  readonly plan = input.required<TradePlanViewModel>();

  readonly currentPrice = input<number | null>(null);

  readonly priceRange = input<TradePlanPriceRange | null>(null);

  readonly compact = input(false);

  readonly showPriceRange = input(true);

  protected readonly legendRows = computed<LegendRowViewModel[]>(() => {
    const levels = TradePlanViewHelper.levels(this.plan(), this.currentPrice());

    return [
      [TradePlanLevel.CurrentPrice, TradePlanLevel.EntryPrice],
      [TradePlanLevel.TakeProfit1, TradePlanLevel.TakeProfit2],
      [TradePlanLevel.StopLoss]
    ].map(keys => ({levels: levels.filter(level => keys.includes(level.labelKey))}));
  });

  protected readonly scale = computed<PlanScaleViewModel | null>(() => {
    const priceRows = this.legendRows()
      .flatMap(row => row.levels)
      .filter((row): row is ValueRowViewModel & {value: number} => row.value != null);

    if (priceRows.length === 0) {
      return null;
    }

    const values = priceRows.map(row => row.value);
    const priceRange = this.priceRange();
    const hasValidRange = priceRange != null
      && Number.isFinite(priceRange.min)
      && Number.isFinite(priceRange.max)
      && priceRange.min > 0
      && priceRange.max > priceRange.min;
    const bounds = TradePlanViewHelper.priceRange(hasValidRange ? [...values, priceRange.min, priceRange.max] : values);
    if (bounds == null) {
      return null;
    }

    const {min: minValue, max: maxValue} = bounds;
    const levels = priceRows
      .map(row => ({
        labelKey: row.labelKey,
        tooltipKey: row.tooltipKey,
        value: row.value,
        positionPercent: this.toPositionPercent(row.value, minValue, maxValue)
      }))
      .sort((left, right) => left.value - right.value);

    return {
      bounds,
      levels,
      riskRange: this.toRange(
        this.getValue(priceRows, TradePlanLevel.EntryPrice),
        this.getValue(priceRows, TradePlanLevel.StopLoss),
        minValue,
        maxValue
      ),
      rewardRange: this.toRange(
        this.getValue(priceRows, TradePlanLevel.EntryPrice),
        this.getValue(priceRows, TradePlanLevel.TakeProfit1),
        minValue,
        maxValue
      ),
      optimisticRange: this.toRange(
        this.getValue(priceRows, TradePlanLevel.EntryPrice),
        this.getValue(priceRows, TradePlanLevel.TakeProfit2),
        minValue,
        maxValue
      )
    };
  });

  private getValue(rows: ValueRowViewModel[], key: TradePlanLevel): number | null {
    return rows.find(row => row.labelKey === key)?.value ?? null;
  }

  private toRange(
    firstValue: number | null,
    secondValue: number | null,
    minValue: number,
    maxValue: number
  ): PlanRangeViewModel | null {
    if (firstValue == null || secondValue == null || firstValue === secondValue) {
      return null;
    }

    const firstPosition = this.toPositionPercent(firstValue, minValue, maxValue);
    const secondPosition = this.toPositionPercent(secondValue, minValue, maxValue);

    return {
      leftPercent: Math.min(firstPosition, secondPosition),
      widthPercent: Math.abs(firstPosition - secondPosition)
    };
  }

  private toPositionPercent(value: number, minValue: number, maxValue: number): number {
    return (value - minValue) / (maxValue - minValue) * 100;
  }
}
