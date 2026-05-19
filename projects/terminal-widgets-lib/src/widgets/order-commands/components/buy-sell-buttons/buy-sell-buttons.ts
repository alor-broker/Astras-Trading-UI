import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {NzButtonComponent} from "ng-zorro-antd/button";
import {TranslocoDirective} from "@jsverse/transloco";
import {Side} from '@terminal-core-lib/common/types/side.types';

@Component({
  selector: 'ats-buy-sell-buttons',
  templateUrl: './buy-sell-buttons.html',
  imports: [
    NzButtonComponent,
    TranslocoDirective
  ],
  styleUrls: ['./buy-sell-buttons.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BuySellButtons {
  readonly sides = Side;

  readonly buyBtnDisabled = input(false);

  readonly sellBtnDisabled = input(false);

  readonly buyBtnLoading = input(false);

  readonly sellBtnLoading = input(false);

  readonly btnClick = output<Side>();
}
