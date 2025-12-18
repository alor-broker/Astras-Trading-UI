import {
  Component,
  Input
} from '@angular/core';
import { OptionBoardDataContext } from "../../models/option-board-data-context.model";
import { TranslocoDirective } from '@jsverse/transloco';
import { OptionBoardChartComponent } from '../option-board-chart/option-board-chart.component';
import { NzAlertComponent } from 'ng-zorro-antd/alert';

@Component({
    selector: 'ats-option-board-charts-layout',
    templateUrl: './option-board-charts-layout.component.html',
    styleUrl: './option-board-charts-layout.component.less',
    imports: [
      TranslocoDirective,
      OptionBoardChartComponent,
      NzAlertComponent
    ]
})
export class OptionBoardChartsLayoutComponent {
  @Input({required: true})
  dataContext!: OptionBoardDataContext;
}
