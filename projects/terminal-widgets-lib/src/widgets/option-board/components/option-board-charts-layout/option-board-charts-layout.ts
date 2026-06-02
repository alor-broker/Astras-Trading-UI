import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzAlertComponent} from 'ng-zorro-antd/alert';
import {OptionBoardDataContext} from '@terminal-widgets-lib/widgets/option-board/types/option-board-data-context.types';
import {OptionBoardChart} from '@terminal-widgets-lib/widgets/option-board/components/option-board-chart/option-board-chart';

@Component({
  selector: 'ats-option-board-charts-layout',
  templateUrl: './option-board-charts-layout.html',
  imports: [
    TranslocoDirective,
    NzAlertComponent,
    OptionBoardChart
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OptionBoardChartsLayout {
  readonly dataContext = input.required<OptionBoardDataContext>();
}
