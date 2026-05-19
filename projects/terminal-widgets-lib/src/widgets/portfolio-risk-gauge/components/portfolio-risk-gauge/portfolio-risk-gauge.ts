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

  protected readonly riskStates = PortfolioRiskStatus;

  protected readonly trackPath = this.getArcPath(0, 100);

  protected readonly segments: GaugeSegment[] = [
    {
      path: this.getArcPath(0, 13.333),
      className: 'green'
    },
    {
      path: this.getArcPath(13.333, 33.333),
      className: 'yellow'
    },
    {
      path: this.getArcPath(33.333, 60),
      className: 'restricted'
    },
    {
      path: this.getArcPath(60, 66.667),
      className: 'red'
    },
    {
      path: this.getArcPath(66.667, 76.667),
      className: 'forced-close-risk'
    },
    {
      path: this.getArcPath(76.667, 100),
      className: 'critical'
    }
  ];

  private readonly gaugeArc = arc<GaugeArc>()
    .innerRadius(d => d.innerRadius)
    .outerRadius(d => d.outerRadius)
    .startAngle(d => d.startAngle)
    .endAngle(d => d.endAngle)
    .cornerRadius(3)
    .padAngle(0.02);

  protected getNeedleTransform(view: PortfolioRiskGaugeView): string {
    return `rotate(${this.valueToAngle(view.gaugeValuePercent ?? 0)})`;
  }

  private getArcPath(startPercent: number, endPercent: number): string {
    return this.gaugeArc({
      startAngle: this.percentToRadians(startPercent),
      endAngle: this.percentToRadians(endPercent),
      innerRadius: 69,
      outerRadius: 82
    }) ?? '';
  }

  private percentToRadians(percent: number): number {
    return (-90 + percent * 1.8) * Math.PI / 180;
  }

  private valueToAngle(value: number): number {
    return -90 + value * 1.8;
  }
}
