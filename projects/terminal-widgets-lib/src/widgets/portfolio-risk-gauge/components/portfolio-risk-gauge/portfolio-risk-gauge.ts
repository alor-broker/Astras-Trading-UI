import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {arc} from 'd3';
import {
  PortfolioRiskGaugeView,
  PortfolioRiskStatus
} from '@terminal-widgets-lib/widgets/portfolio-risk-gauge/types/portfolio-risk-gauge.types';

interface GaugeSegment {
  path: string;
  className: string;
}

interface GaugeArc {
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
}

@Component({
  selector: 'ats-portfolio-risk-gauge',
  imports: [
    DecimalPipe,
    TranslocoDirective
  ],
  templateUrl: './portfolio-risk-gauge.html',
  styleUrls: ['./portfolio-risk-gauge.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class PortfolioRiskGauge {
  readonly view = input.required<PortfolioRiskGaugeView>();

  private static readonly gaugeArc = arc<GaugeArc>()
    .innerRadius(d => d.innerRadius)
    .outerRadius(d => d.outerRadius)
    .startAngle(d => d.startAngle)
    .endAngle(d => d.endAngle)
    .cornerRadius(3)
    .padAngle(0.02);

  protected readonly riskStates = PortfolioRiskStatus;

  protected readonly trackPath = PortfolioRiskGauge.getArcPath(0, 100);

  protected readonly segments: GaugeSegment[] = [
    {
      path: PortfolioRiskGauge.getArcPath(0, 13.333),
      className: 'green'
    },
    {
      path: PortfolioRiskGauge.getArcPath(13.333, 33.333),
      className: 'yellow'
    },
    {
      path: PortfolioRiskGauge.getArcPath(33.333, 60),
      className: 'restricted'
    },
    {
      path: PortfolioRiskGauge.getArcPath(60, 66.667),
      className: 'red'
    },
    {
      path: PortfolioRiskGauge.getArcPath(66.667, 76.667),
      className: 'forced-close-risk'
    },
    {
      path: PortfolioRiskGauge.getArcPath(76.667, 100),
      className: 'critical'
    }
  ];

  protected getNeedleTransform(view: PortfolioRiskGaugeView): string {
    return `rotate(${this.valueToAngle(view.gaugeValuePercent ?? 0)})`;
  }

  private static getArcPath(startPercent: number, endPercent: number): string {
    return PortfolioRiskGauge.gaugeArc({
      startAngle: PortfolioRiskGauge.percentToRadians(startPercent),
      endAngle: PortfolioRiskGauge.percentToRadians(endPercent),
      innerRadius: 69,
      outerRadius: 82
    }) ?? '';
  }

  private static percentToRadians(percent: number): number {
    return (-90 + percent * 1.8) * Math.PI / 180;
  }

  private valueToAngle(value: number): number {
    return -90 + value * 1.8;
  }
}
