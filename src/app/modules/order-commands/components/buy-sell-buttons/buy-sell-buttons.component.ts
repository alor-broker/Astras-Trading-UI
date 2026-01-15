import {Component, input, output} from '@angular/core';
import {Side} from "../../../../shared/models/enums/side.model";
import { NzButtonComponent } from "ng-zorro-antd/button";
import { TranslocoDirective } from "@jsverse/transloco";

@Component({
    selector: 'ats-buy-sell-buttons',
    templateUrl: './buy-sell-buttons.component.html',
    imports: [
        NzButtonComponent,
        TranslocoDirective
    ],
    styleUrls: ['./buy-sell-buttons.component.less']
})
export class BuySellButtonsComponent {
  readonly sides = Side;

  readonly buyBtnDisabled = input(false);

  readonly sellBtnDisabled = input(false);

  readonly buyBtnLoading = input(false);

  readonly sellBtnLoading = input(false);

  readonly btnClick = output<Side>();
}
