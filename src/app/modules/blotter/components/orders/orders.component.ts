import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { OrderFilter } from '../../models/order-filter.model';
import { Order } from '../../../../shared/models/orders/order.model';
import { BlotterService } from 'src/app/shared/services/blotter.service';
import { Column } from '../../models/column.model';

@Component({
  selector: 'ats-orders[shouldShowSettings][guid]',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.less']
})
export class OrdersComponent implements OnInit, OnDestroy {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  private cancelCommands = new Subject<CancelCommand>();
  private cancels$ = this.cancelCommands.asObservable()
  private cancelSub? : Subscription;
  private settingsSub? : Subscription;

  private orders: Order[] = [];
  private orders$: Observable<Order[]> = of([]);
  displayOrders$: Observable<Order[]> = of([]);
  maxVolume: number = 1;
  searchFilter = new BehaviorSubject<OrderFilter>({ });

  allColumns: Column<Order, OrderFilter>[] = [
    {
      id: 'id',
      name: 'Id',
      sortOrder: null,
      sortFn: (a: Order, b: Order) => Number(a.id) - Number(b.id),
      searchDescription: 'Поиск по Номеру',
      searchFn: (order, filter) => filter.id ? order.id.toLowerCase().includes(filter.id.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'symbol',
      name: 'Тикер',
      sortOrder: null,
      sortFn: (a: Order, b: Order) => a.symbol.localeCompare(b.symbol),
      searchDescription: 'Поиск по Тикеру',
      searchFn: (order, filter) => filter.symbol ? order.symbol.toLowerCase().includes(filter.symbol.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'side',
      name: 'Сторона',
      sortOrder: null,
      sortFn: (a: Order, b: Order) => a.side.toString().localeCompare(b.side.toString()),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], order: Order) => list.some(val => order.side.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: 'Покупка', value: 'buy' },
        { text: 'Продажа', value: 'sell' }
      ],
      isFilterVisible: false,
      hasFilter: true,
    },
    {
      id: 'qty',
      name: 'Кол-во',
      sortOrder: null,
      sortFn: (a: Order, b: Order) => Number(a.qty) - Number(b.qty),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'price',
      name: 'Цена',
      sortOrder: null,
      sortFn: (a: Order, b: Order) => Number(a.price) - Number(b.price),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'status',
      name: 'Статус',
      sortOrder: null,
      sortFn: (a: Order, b: Order) => a.status.localeCompare(b.status),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], order: Order) => list.some(val => order.status.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: 'Исполнена', value: 'filled' },
        { text: 'В работе', value: 'working' },
        { text: 'Отменена', value: 'canceled' }
      ],
      isFilterVisible: false,
      hasFilter: true,
    },
    {
      id: 'transTime',
      name: 'Время',
      sortOrder: null,
      sortFn: (a: Order, b: Order) => Number(a.transTime) - Number(b.transTime),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
  ]

  listOfColumns: Column<Order, OrderFilter>[] = [];

  constructor(private service: BlotterService, private cancller: OrderCancellerService) { }

  ngOnInit(): void {
    this.settingsSub = this.service.getSettings(this.guid).pipe(
      tap(s => {
        if (s.ordersColumns) {
          this.listOfColumns = this.allColumns.filter(c => s.ordersColumns.includes(c.id))
        }
      })
    ).subscribe();
    this.orders$ = this.service.getOrders(this.guid).pipe(
      tap(orders => this.orders = orders)
    );
    this.displayOrders$ = this.orders$.pipe(
      mergeMap(orders => this.searchFilter.pipe(
        map(f => orders.filter(o => this.justifyFilter(o, f)))
      )),
    )
    this.cancelSub = this.cancels$.pipe(
      mergeMap((command) => this.cancller.cancelOrder(command)),
      catchError((_, caught) => caught)
    ).subscribe()
  }

  ngOnDestroy(): void {
    this.cancelSub?.unsubscribe();
    this.settingsSub?.unsubscribe();
  }

  reset(): void {
    this.searchFilter.next({ });
  }

  filterChange(text: string, option: string ) {
    const newFilter = this.searchFilter.getValue();
    if (option) {
      newFilter[option as keyof OrderFilter] = text;
      this.searchFilter.next(newFilter)
    }
  }

  getFilter(columnId: string) {
    return this.searchFilter.getValue()[columnId as keyof OrderFilter];
  }

  cancelOrder(orderId: string) {
    const settings = this.service.getSettingsValue();
    if (settings) {
      this.cancelCommands?.next({
        portfolio: settings.portfolio,
        exchange: settings.exchange,
        orderid: orderId,
        stop: false
      })
    }
  }

  shouldShow(column: string) {
    return this.listOfColumns.map(c => c.id).includes(column);
  }

  cancelAllOrders() {
    const working = this.orders.filter(o => o.status == 'working').map(o => o.id)
    working.forEach(order => this.cancelOrder(order));
  }

  translateStatus(status: string) {
    switch (status) {
      case 'filled':
        return 'Исполнена';
      case 'canceled':
        return 'Отменена';
      case 'working':
        return 'В работе';
      default:
        return status;
    }
  }

  formatDate(date: Date) {
    return new Date(date).toLocaleTimeString();
  }

  private justifyFilter(order: Order, filter: OrderFilter) : boolean {
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof OrderFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        return column?.searchFn ? column.searchFn(order, filter) : false;
      }
    }
    return true;
  }
}
