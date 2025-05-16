import {
  Component,
  Input
} from '@angular/core';
import { OptionBoardDataContext } from "../../models/option-board-data-context.model";

@Component({
    selector: 'ats-option-board-charts-layout',
    templateUrl: './option-board-charts-layout.component.html',
    styleUrl: './option-board-charts-layout.component.less',
    standalone: false
})
export class OptionBoardChartsLayoutComponent {
  @Input({required: true})
  dataContext!: OptionBoardDataContext;
}
