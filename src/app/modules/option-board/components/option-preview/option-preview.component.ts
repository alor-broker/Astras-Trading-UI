import {Component, input} from '@angular/core';
import {Option, OptionParameters} from "../../models/option-board.model";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {DecimalPipe, NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'ats-option-preview',
  templateUrl: './option-preview.component.html',
  styleUrls: ['./option-preview.component.less'],
  imports: [
    TranslocoDirective,
    NgTemplateOutlet,
    DecimalPipe
  ]
})
export class OptionPreviewComponent {
  optionParameter = OptionParameters;
  readonly option = input.required<Option>();

  formatNumberParameter(value: number, decimals = 2): number {
    return MathHelper.round(value, decimals);
  }
}
