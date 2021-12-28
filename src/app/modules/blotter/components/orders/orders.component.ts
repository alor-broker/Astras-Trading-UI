import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NzTableComponent } from 'ng-zorro-antd/table';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { filter, map, mergeMap, switchMap, takeUntil } from 'rxjs/operators';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { OrderFilter } from '../../models/order-filter.model';
import { Order } from '../../models/order.model';
import { BlotterService } from '../../services/blotter.service';

@Component({
  selector: 'ats-orders[shouldShowSettings][widget][settings]',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.sass']
})
export class OrdersComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<BlotterSettings>;
  @Input('settings') set settings(settings: BlotterSettings) { this.settings$.next(settings); };
  private settings$ = new BehaviorSubject<BlotterSettings | null>(null);
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  private orders$: Observable<Order[]> = of([]);
  displayOrders$: Observable<Order[]> = of([]);
  maxVolume: number = 1;
  searchFilter = new BehaviorSubject<OrderFilter>({
    idMenuVisible: false,
    symbolMenuVisible: false
  });
  constructor(private service: BlotterService) { }

  ngOnInit(): void {
    this.orders$ = this.settings$.pipe(
      filter((s): s is BlotterSettings => !!s),
      switchMap(s => this.service.getOrders(s.portfolio, s.exchange))
    )
    this.displayOrders$ = this.orders$.pipe(
      mergeMap(orders => this.searchFilter.pipe(
        map(f => orders.filter(o => this.justifyFilter(o, f)))
      )),
    )
  }

  reset(): void {
    this.searchFilter.next({
      idMenuVisible: false,
      symbolMenuVisible: false
    });
  }

  filterChange(text: string, option: 'symbol' ) {
    const newFilter = this.searchFilter.getValue();
    newFilter[option] = text;
    this.searchFilter.next(newFilter)
  }

  getFilter() {
    return this.searchFilter.getValue();
  }

  private justifyFilter(order: Order, filter: OrderFilter) : boolean {
    if (filter.symbol) {
      return order.symbol.toLowerCase().includes(filter.symbol.toLowerCase());
    }
    return true;
  }
}
