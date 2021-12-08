import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ColDef } from 'ag-grid-community';

import { DashboardItem } from '../../../../shared/models/dashboard-item.model';
import { OrderbookService } from '../../services/orderbook.service';
import { OrderbookRow } from '../../models/orderbook-row.model';
import { AgGridAngular } from 'ag-grid-angular';

type Widget = OnInit & DashboardItem;

@Component({
  selector: 'ats-order-book[widget][resize]',
  templateUrl: './order-book.component.html',
  styleUrls: ['./order-book.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class OrderBookComponent implements OnInit {
  @Input()
  widget!: DashboardItem;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @ViewChild('agGrid') agGrid!: AgGridAngular;


  resizeSub!: Subscription;

  columnDefs: ColDef[] = [
    { field: 'volume' },
    { field: 'price' },
  ];

  rowData : OrderbookRow[] = [ ] ;
  bids$: Observable<OrderbookRow[]>;

  constructor(private service: OrderbookService) {
    this.bids$ = service.bids$;
  }

  ngOnInit(): void {
    this.resizeSub = this.resize.subscribe((widget) => {
      if (widget === this.widget) {
        // or check id , type or whatever you have there
        // resize your widget, chart, map , etc.
        console.log(widget);
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeSub.unsubscribe();
  }
}
