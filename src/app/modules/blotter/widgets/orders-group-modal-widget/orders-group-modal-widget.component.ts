import {Component, OnInit, input} from '@angular/core';
import {Observable, of} from "rxjs";
import {BlotterService} from "../../services/blotter.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from 'ng-zorro-antd/modal';
import {OrdersGroupModalComponent} from '../../components/orders-group-modal/orders-group-modal.component';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-orders-group-modal-widget',
  templateUrl: './orders-group-modal-widget.component.html',
  styleUrls: ['./orders-group-modal-widget.component.less'],
  imports: [
    TranslocoDirective,
    NzModalComponent,
    NzModalContentDirective,
    OrdersGroupModalComponent,
    NzModalFooterDirective,
    NzButtonComponent,
    AsyncPipe
  ]
})
export class OrdersGroupModalWidgetComponent implements OnInit {
  readonly guid = input.required<string>();

  isVisible$: Observable<boolean> = of(false);
  groupId$: Observable<string | null> = of(null);

  constructor(
    private readonly service: BlotterService
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.service.shouldShowOrderGroupModal$;
    this.groupId$ = this.service.orderGroupParams$;
  }

  handleCancel(): void {
    this.service.closeOrderGroupModal();
  }
}
