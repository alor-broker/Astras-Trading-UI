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
import {ShortNumber} from '@terminal-core-lib/common/components/short-number/short-number';
import {AtsPrice} from '@terminal-core-lib/common/pipes/price';

@Component({
  selector: 'ats-orderbook-table-volumes-at-the-edges',
  templateUrl: './orderbook-table-volumes-at-the-edges.html',
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
export class OrderbookTableVolumesAtTheEdges extends OrderbookTableBase {

}
