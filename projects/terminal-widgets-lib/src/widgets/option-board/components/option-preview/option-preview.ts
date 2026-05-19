import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  DecimalPipe,
  NgTemplateOutlet
} from '@angular/common';
import {
  Option,
  OptionParameters
} from '@terminal-widgets-lib/widgets/option-board/types/option-board.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';

@Component({
  selector: 'ats-option-preview',
  templateUrl: './option-preview.html',
  imports: [
    TranslocoDirective,
    NgTemplateOutlet,
    DecimalPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OptionPreview {
  optionParameter = OptionParameters;

  readonly option = input.required<Option>();

  formatNumberParameter(value: number, decimals = 2): number {
    return MathHelper.round(value, decimals);
  }
}
