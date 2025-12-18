import {Component} from '@angular/core';
import {OrderbookTableBaseComponent} from "../orderbook-table-base.component";
import {
  NzCellAlignDirective,
  NzTableCellDirective,
  NzTableComponent,
  NzTbodyComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from 'ng-zorro-antd/table';
import {CdkDrag, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import {AsyncPipe, NgStyle} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {ShortNumberComponent} from '../../../../../shared/components/short-number/short-number.component';
import {AtsPricePipe} from '../../../../../shared/pipes/ats-price.pipe';

@Component({
  selector: 'ats-orderbook-table-volumes-at-the-middle[guid]',
  templateUrl: './orderbook-table-volumes-at-the-middle.component.html',
  styleUrls: ['../orderbook-table-base.component.less'],
  imports: [
    NzTableComponent,
    NzTheadComponent,
    NzTrDirective,
    NzTableCellDirective,
    NzThMeasureDirective,
    NzCellAlignDirective,
    NzTbodyComponent,
    CdkDropListGroup,
    NgStyle,
    CdkDropList,
    NzButtonComponent,
    CdkDrag,
    NzIconDirective,
    ShortNumberComponent,
    AsyncPipe,
    AtsPricePipe
  ]
})
export class OrderbookTableVolumesAtTheMiddleComponent extends OrderbookTableBaseComponent {

}
