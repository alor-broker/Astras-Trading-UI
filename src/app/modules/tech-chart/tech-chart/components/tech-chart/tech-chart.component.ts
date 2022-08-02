import {
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'ats-tech-chart[guid][shouldShowSettings]',
  templateUrl: './tech-chart.component.html',
  styleUrls: ['./tech-chart.component.less']
})
export class TechChartComponent {
  @Input() shouldShowSettings!: boolean;
  @Input() guid!: string;

  constructor() {
  }
}
