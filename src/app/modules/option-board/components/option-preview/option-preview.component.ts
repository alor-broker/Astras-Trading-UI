import {Component, Input} from '@angular/core';
import {Option, OptionParameters} from "../../models/option-board.model";
import {MathHelper} from "../../../../shared/utils/math-helper";

@Component({
  selector: 'ats-option-preview',
  templateUrl: './option-preview.component.html',
  styleUrls: ['./option-preview.component.less']
})
export class OptionPreviewComponent {
  optionParameter = OptionParameters;

  @Input({required: true})
  option!: Option;

  formatNumberParameter(value: number, decimals = 2): number {
    return MathHelper.round(value, decimals);
  }
}
