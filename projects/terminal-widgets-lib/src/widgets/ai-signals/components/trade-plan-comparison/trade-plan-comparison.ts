import {DecimalPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTableModule} from 'ng-zorro-antd/table';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {AtsPrice} from '@terminal-core-lib/common/pipes/price';
import {SignalAction} from '../../services/ai-signals-service.types';
import {
  AnalystViewModel,
  SignalSummaryViewModel,
  TradePlanPriceRange,
  TradePlanViewModel
} from '../../types/ai-signals-view.types';
import {TradePlanLevel} from '../../types/trade-plan-level.types';
import {TradePlanViewHelper} from '../../utils/trade-plan-view.helper';
import {TradePlanMarker} from '../trade-plan-marker/trade-plan-marker';
import {TradePlanChart} from '../trade-plan-chart/trade-plan-chart';
import {SignalSection} from '../signal-section/signal-section';

interface ComparisonRow {
  index: number | null;
  plan: TradePlanViewModel | null;
  noTrade: boolean;
  hasPrices: boolean;
}

@Component({
  selector: 'ats-trade-plan-comparison',
  imports: [
    SignalSection,
    DecimalPipe,
    TranslocoDirective,
    NzTableModule,
    NzTooltipDirective,
    AtsPrice,
    TradePlanChart,
    TradePlanMarker
  ],
  templateUrl: './trade-plan-comparison.html',
  styleUrl: './trade-plan-comparison.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradePlanComparison {
  readonly analysts = input.required<readonly AnalystViewModel[]>();

  readonly consensus = input.required<SignalSummaryViewModel>();

  protected readonly levelKeys = TradePlanLevel;

  protected readonly legend = Object.values(TradePlanLevel).map(level => ({
    level,
    tooltipKey: TradePlanViewHelper.tooltipKey(level)
  }));

  protected readonly rows = computed<ComparisonRow[]>(() => [
    ...this.analysts().map(analyst => this.toRow(analyst.index, analyst)),
    this.toRow(null, this.consensus())
  ]);

  protected readonly priceRange = computed<TradePlanPriceRange | null>(() => {
    const values = this.rows().flatMap(row => TradePlanViewHelper.prices(row.plan));
    if (values.length === 0) {
      return null;
    }

    const currentPrice = this.consensus().currentPrice;
    if (currentPrice != null && Number.isFinite(currentPrice) && currentPrice > 0) {
      values.push(currentPrice);
    }

    return TradePlanViewHelper.priceRange(values);
  });

  private toRow(index: number | null, summary: SignalSummaryViewModel): ComparisonRow {
    const noTrade = summary.action === SignalAction.NoTrade;
    const plan = noTrade ? null : summary.tradePlan;

    return {index, plan, noTrade, hasPrices: TradePlanViewHelper.prices(plan).length > 0};
  }
}
