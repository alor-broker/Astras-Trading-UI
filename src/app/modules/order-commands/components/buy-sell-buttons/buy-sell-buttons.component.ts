import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Side} from "../../../../shared/models/enums/side.model";
import { NzButtonComponent } from "ng-zorro-antd/button";
import { TranslocoDirective } from "@jsverse/transloco";

@Component({
  selector: 'ats-buy-sell-buttons',
  templateUrl: './buy-sell-buttons.component.html',
  standalone: true,
  imports: [
    NzButtonComponent,
    TranslocoDirective
  ],
  styleUrls: ['./buy-sell-buttons.component.less']
})
export class BuySellButtonsComponent {
  readonly sides = Side;

  @Input()
  buyBtnDisabled = false;

  @Input()
  sellBtnDisabled = false;

  @Input()
  buyBtnLoading = false;

  @Input()
  sellBtnLoading = false;

  @Output()
  readonly btnClick = new EventEmitter<Side>();
}
