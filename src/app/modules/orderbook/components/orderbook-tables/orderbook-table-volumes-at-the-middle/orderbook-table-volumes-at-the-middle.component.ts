import {ChangeDetectionStrategy, Component} from '@angular/core';
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
import {NgStyle} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {ShortNumberComponent} from '../../../../../shared/components/short-number/short-number.component';
import {AtsPricePipe} from '../../../../../shared/pipes/ats-price.pipe';

@Component({
  selector: 'ats-orderbook-table-volumes-at-the-middle',
  templateUrl: './orderbook-table-volumes-at-the-middle.component.html',
  styleUrls: ['../orderbook-table-base.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    AtsPricePipe
  ]
})
export class OrderbookTableVolumesAtTheMiddleComponent extends OrderbookTableBaseComponent {

}
