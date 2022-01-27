import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { OrderFilter } from '../../models/order-filter.model';
import { Order } from '../../../../shared/models/orders/order.model';
import { BlotterService } from 'src/app/shared/services/blotter.service';

@Component({
  selector: 'ats-orders[shouldShowSettings][widget][settings]',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.less']
})
export class OrdersComponent implements OnInit, OnDestroy {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<BlotterSettings>;
  @Input('settings') set settings(settings: BlotterSettings) { this.settings$.next(settings); };
  private settings$ = new BehaviorSubject<BlotterSettings | null>(null);
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  private cancelCommands = new Subject<CancelCommand>();
  private cancels$ = this.cancelCommands.asObservable()
  private cancelSub? : Subscription;

  private orders: Order[] = [];
  private orders$: Observable<Order[]> = of([]);
  displayOrders$: Observable<Order[]> = of([]);
  maxVolume: number = 1;
  searchFilter = new BehaviorSubject<OrderFilter>({
    idMenuVisible: false,
    symbolMenuVisible: false
  });
  constructor(private service: BlotterService, private cancller: OrderCancellerService) { }

  ngOnInit(): void {
    this.orders$ = this.service.getOrders().pipe(
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
  }

  reset(): void {
    this.searchFilter.next({
      idMenuVisible: false,
      symbolMenuVisible: false
    });
  }

  filterChange(text: string, option: 'symbol' | 'id' ) {
    const newFilter = this.searchFilter.getValue();
    newFilter[option] = text;
    this.searchFilter.next(newFilter)
  }

  sortBy(option: 'symbol' | 'id') {
    if (option == 'id') {
      return (o1: Order, o2: Order) =>  Number(o1.id) - Number(o2.id);
    }
    else return (o1: Order, o2: Order) => o1.symbol.localeCompare(o2.symbol);
  }

  getFilter() {
    return this.searchFilter.getValue();
  }

  cancelOrder(orderId: string) {
    const settings = this.service.getSettings();
    if (settings) {
      this.cancelCommands?.next({
        portfolio: settings.portfolio,
        exchange: settings.exchange,
        orderid: orderId,
        stop: false
      })
    }
  }

  cancelAllOrders() {
    const working = this.orders.filter(o => o.status == 'working').map(o => o.id)
    working.forEach(order => this.cancelOrder(order));
  }

  private justifyFilter(order: Order, filter: OrderFilter) : boolean {
    if (filter.symbol) {
      return order.symbol.toLowerCase().includes(filter.symbol.toLowerCase());
    }
    if (filter.id) {
      return order.id.toLowerCase().includes(filter.id.toLowerCase());
    }
    return true;
  }
}
