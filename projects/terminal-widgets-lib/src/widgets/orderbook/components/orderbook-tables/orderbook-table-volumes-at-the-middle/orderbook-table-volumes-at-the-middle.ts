import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {
  NzCellAlignDirective,
  NzTableCellDirective,
  NzTableComponent,
  NzTbodyComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from 'ng-zorro-antd/table';
import {
  CdkDrag,
  CdkDropList,
  CdkDropListGroup
} from '@angular/cdk/drag-drop';

import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {OrderbookTableBase} from '@terminal-widgets-lib/widgets/orderbook/components/orderbook-tables/orderbook-table-base';
import {AtsPrice} from '@terminal-core-lib/common/pipes/price';
import {ShortNumber} from '@terminal-core-lib/common/components/short-number/short-number';

@Component({
  selector: 'ats-orderbook-table-volumes-at-the-middle',
  templateUrl: './orderbook-table-volumes-at-the-middle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NzTableComponent,
    NzTheadComponent,
    NzTrDirective,
    NzTableCellDirective,
    NzThMeasureDirective,
    NzCellAlignDirective,
    NzTbodyComponent,
    CdkDropListGroup,
    CdkDropList,
    NzButtonComponent,
    CdkDrag,
    NzIconDirective,
    ShortNumber,
    AtsPrice
  ]
})
export class OrderbookTableVolumesAtTheMiddle extends OrderbookTableBase {

}
