import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil
} from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { OrderFilter } from '../../models/order-filter.model';
import { Order } from '../../../../shared/models/orders/order.model';
import { Column } from '../../models/column.model';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { BlotterService } from '../../services/blotter.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";
import { ExportHelper } from "../../utils/export-helper";
import { NzTableComponent } from 'ng-zorro-antd/table';
import { isEqualBlotterSettings } from "../../../../shared/utils/settings-helper";

interface DisplayOrder extends Order {
  residue: string,
  volume: number
}

@Component({
  selector: 'ats-orders[shouldShowSettings][guid]',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.less'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  @ViewChild('nzTable')
  table?: NzTableComponent<DisplayOrder>;

  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  displayOrders$: Observable<DisplayOrder[]> = of([]);
  searchFilter = new BehaviorSubject<OrderFilter>({});
  isFilterDisabled = () => Object.keys(this.searchFilter.getValue()).length === 0;
  tableInnerWidth: string = '1000px';
  allColumns: Column<DisplayOrder, OrderFilter>[] = [
    {
      id: 'id',
      name: 'Id',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => Number(a.id) - Number(b.id),
      searchDescription: '?????????? ???? ????????????',
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
      name: '??????????',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => a.symbol.localeCompare(b.symbol),
      searchDescription: '?????????? ???? ????????????',
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
      name: '??????????????',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => a.side.toString().localeCompare(b.side.toString()),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], order: Order) => list.some(val => order.side.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: '??????????????', value: 'buy' },
        { text: '??????????????', value: 'sell' }
      ],
      isFilterVisible: false,
      hasFilter: true,
    },
    {
      id: 'residue',
      name: '??????????????',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.filled - a.filled,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'volume',
      name: '??????????',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.volume - a.volume,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'qty',
      name: '??????-????',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.qty - a.qty,
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
      name: '????????',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.price - a.price,
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
      name: '????????????',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => a.status.localeCompare(b.status),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], order: DisplayOrder) => list.some(val => order.status.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: '??????????????????', value: 'filled' },
        { text: '??????????????', value: 'working' },
        { text: '????????????????', value: 'canceled' }
      ],
      isFilterVisible: false,
      hasFilter: true,
    },
    {
      id: 'transTime',
      name: '??????????',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => Number(b.transTime) - Number(a.transTime),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
    {
      id: 'exchange',
      name: '??????????',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.exchange.localeCompare(a.exchange),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], order: DisplayOrder) => list.some(val => order.exchange.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: '????????', value: 'MOEX' },
        { text: '??????', value: 'SPBX' }
      ],
      isFilterVisible: false,
      hasFilter: true,
    },
    {
      id: 'type',
      name: '??????',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => b.type.localeCompare(a.type),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: (list: string[], order: DisplayOrder) => list.some(val => order.type.toString().indexOf(val) !== -1),
      listOfFilter: [
        { text: '??????????', value: 'limit' },
        { text: '????????????.', value: 'market' }
      ],
      isFilterVisible: false,
      hasFilter: true,
    },
    {
      id: 'endTime',
      name: '????????????. ????.',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder) => Number(b.endTime) - Number(a.endTime),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
    },
  ];
  listOfColumns: Column<DisplayOrder, OrderFilter>[] = [];
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private cancelCommands = new Subject<CancelCommand>();
  private cancels$ = this.cancelCommands.asObservable();
  private orders: Order[] = [];
  private orders$: Observable<Order[]> = of([]);
  private settings$!: Observable<BlotterSettings>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: BlotterService,
    private readonly canceller: OrderCancellerService,
    private readonly modal: ModalService,
    private readonly timezoneConverterService: TimezoneConverterService) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualBlotterSettings(previous, current)),
      shareReplay()
    );

    this.settings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(s => {
      if (s.ordersColumns) {
        this.listOfColumns = this.allColumns.filter(c => s.ordersColumns.includes(c.id));
        this.tableInnerWidth = `${this.listOfColumns.length * 100}px`;
      }
    });

    this.orders$ = this.settings$.pipe(
      switchMap(settings=>this.service.getOrders(settings)),
      tap(orders => this.orders = orders)
    );

    this.displayOrders$ = combineLatest([
      this.orders$,
      this.searchFilter,
      this.timezoneConverterService.getConverter()
    ]).pipe(
      map(([orders, f, converter]) => orders
        .map(o => ({
          ...o,
          residue: `${o.filled}/${o.qty}`,
          volume: MathHelper.round(o.qtyUnits * o.price, 2),
          transTime: converter.toTerminalDate(o.transTime),
          endTime: !!o.endTime ? converter.toTerminalDate(o.endTime) : o.endTime
        }))
        .filter(o => this.justifyFilter(o, f))
        .sort(this.sortOrders))
    );

    this.cancels$.pipe(
      mergeMap((command) => this.canceller.cancelOrder(command)),
      catchError((_, caught) => caught),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  reset(): void {
    this.searchFilter.next({});
  }

  filterChange(text: string, option: string) {
    const newFilter = this.searchFilter.getValue();
    if (option) {
      newFilter[option as keyof OrderFilter] = text;
      this.searchFilter.next(newFilter);
    }
  }

  getFilter(columnId: string) {
    return this.searchFilter.getValue()[columnId as keyof OrderFilter];
  }

  cancelOrder(orderId: string) {
    this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      take(1)
    ).subscribe(settings => {
      this.cancelCommands?.next({
        portfolio: settings.portfolio,
        exchange: settings.exchange,
        orderid: orderId,
        stop: false
      });
    });
  }

  editOrder(order: Order) {
    this.modal.openEditModal({
      type: order.type,
      quantity: order.qty,
      orderId: order.id,
      price: order.price,
      instrument: {
        symbol: order.symbol,
        exchange: order.exchange
      },
      user: {
        portfolio: order.portfolio,
        exchange: order.exchange
      },
      side: order.side
    });
  }

  shouldShow(column: string) {
    return this.listOfColumns.map(c => c.id).includes(column);
  }

  cancelAllOrders() {
    const working = this.orders.filter(o => o.status == 'working').map(o => o.id);
    working.forEach(order => this.cancelOrder(order));
  }

  translateStatus(status: string) {
    switch (status) {
      case 'filled':
        return '????????????';
      case 'canceled':
        return '??????????????';
      case 'working':
        return '??????????????';
      default:
        return status;
    }
  }

  formatDate(date: Date) {
    return new Date(date).toLocaleTimeString();
  }

  selectInstrument(symbol: string, exchange: string) {
    this.service.selectNewInstrument(symbol, exchange);
  }

  isFilterApplied(column: Column<DisplayOrder, OrderFilter>) {
    const filter = this.searchFilter.getValue();
    return column.id in filter && filter[column.id] !== '';
  }

  get canExport(): boolean {
    return !!this.table?.data && this.table.data.length > 0;
  }

  exportToFile() {
    const valueTranslators = new Map<string, (value: any) => string>([
      ['status', value => this.translateStatus(value)],
      ['transTime', value => this.formatDate(value)],
      ['endTime', value => this.formatDate(value)],
    ]);

    this.settings$.pipe(take(1)).subscribe(settings => {
      ExportHelper.exportToCsv(
        '????????????',
        settings,
        [...this.table?.data ?? []],
        this.listOfColumns,
        valueTranslators
      );
    });
  }

  private justifyFilter(order: DisplayOrder, filter: OrderFilter): boolean {
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof OrderFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        return column?.searchFn ? column.searchFn(order, filter) : false;
      }
    }
    return true;
  }

  private sortOrders(a: DisplayOrder, b: DisplayOrder) {
    if (a.status == 'working' && b.status != 'working') {
      return -1;
    }
    else if (b.status == 'working' && a.status != 'working') {
      return 1;
    }
    if (a.endTime < b.endTime) {
      return -1;
    }
    else if (a.endTime > b.endTime) {
      return 1;
    }
    return 0;
  }
}
