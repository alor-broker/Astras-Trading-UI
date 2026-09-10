import {DatePipe, DecimalPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTableModule} from 'ng-zorro-antd/table';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {FundamentalViewModelHelper} from '../../utils/fundamental-view-model.helper';
import {FundamentalTrendChart} from '../fundamental-trend-chart/fundamental-trend-chart';
import {SignalSection} from '../signal-section/signal-section';

@Component({
  selector: 'ats-signal-fundamental',
  imports: [
    SignalSection,
    DatePipe,
    DecimalPipe,
    TranslocoDirective,
    NzIconDirective,
    NzTableModule,
    NzTagComponent,
    NzTooltipDirective,
    FundamentalTrendChart
  ],
  templateUrl: './signal-fundamental.html',
  styleUrl: './signal-fundamental.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': 'viewModel() == null ? "none" : null'
  }
})
export class SignalFundamental {
  readonly fundamental = input<Record<string, unknown> | null>(null);

  protected readonly viewModel = computed(() => FundamentalViewModelHelper.toViewModel(this.fundamental()));

  protected readonly reportQuarter = computed(() => {
    const period = this.viewModel()?.reportPeriod;
    const match = period == null ? null : /^(\d{4})\s+Q([1-4])$/.exec(period);

    return match == null ? null : {year: Number(match[1]), quarter: Number(match[2])};
  });

  protected readonly trends = computed(() => (this.viewModel()?.trends ?? []).map(trend => ({
    ...trend,
    hasHistory: trend.points.filter(point => point.value != null).length >= 2
  })));
}
