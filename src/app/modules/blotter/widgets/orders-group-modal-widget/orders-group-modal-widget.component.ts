import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from "rxjs";
import { BlotterService } from "../../services/blotter.service";

@Component({
    selector: 'ats-orders-group-modal-widget',
    templateUrl: './orders-group-modal-widget.component.html',
    styleUrls: ['./orders-group-modal-widget.component.less'],
    standalone: false
})
export class OrdersGroupModalWidgetComponent implements OnInit {
  @Input({required: true})
  guid!: string;

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
