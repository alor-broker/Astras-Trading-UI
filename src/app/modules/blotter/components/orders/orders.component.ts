import {
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  switchMap,
  take,
} from 'rxjs';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { OrderFilter } from '../../models/order-filter.model';
import {
  Order,
  OrderType
} from '../../../../shared/models/orders/order.model';
import { BlotterService } from '../../services/blotter.service';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  isEqualPortfolioDependedSettings
} from "../../../../shared/utils/settings-helper";
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { mapWith } from "../../../../shared/utils/observable-helper";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { ColumnsNames, TableNames } from '../../models/blotter-settings.model';
import { BaseColumnSettings, FilterType } from "../../../../shared/models/settings/table-settings.model";
import { OrdersGroupService } from "../../../../shared/services/orders/orders-group.service";
import { DomHelper } from "../../../../shared/utils/dom-helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BlotterBaseTableComponent } from "../blotter-base-table/blotter-base-table.component";
import { OrdersDialogService } from "../../../../shared/services/orders/orders-dialog.service";
import { OrderFormType } from "../../../../shared/models/orders/orders-dialog.model";
import { TableConfig } from "../../../../shared/models/table-config.model";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { WsOrdersService } from "../../../../shared/services/orders/ws-orders.service";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";

interface DisplayOrder extends Order {
  residue: string;
  volume: number | null;
}

@Component({
  selector: 'ats-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.less'],
})
export class OrdersComponent extends BlotterBaseTableComponent<DisplayOrder, OrderFilter> implements OnInit {
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  isModalOpened = DomHelper.isModalOpen;
  allColumns: BaseColumnSettings<DisplayOrder>[] = [
    {
      id: 'id',
      displayName: 'Id',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => Number(a.id) - Number(b.id),
      filterData: {
        filterName: 'id',
        filterType: FilterType.Search
      },
      tooltip: 'Идентификационный номер заявки'
    },
    {
      id: 'symbol',
      displayName: 'Тикер',
      sortOrder: null,
      transformFn: data => data.targetInstrument.symbol,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => a.targetInstrument.symbol.localeCompare(b.targetInstrument.symbol),
      filterData: {
        filterName: 'symbol',
        filterType: FilterType.Search
      },
      tooltip: 'Биржевой идентификатор ценной бумаги',
      minWidth: 75
    },
    {
      id: 'side',
      displayName: 'Сторона',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => a.side.toString().localeCompare(b.side.toString()),
      filterData: {
        filterName: 'side',
        filterType: FilterType.DefaultMultiple,
        filters: [
          { text: 'Покупка', value: 'buy' },
          { text: 'Продажа', value: 'sell' }
        ]
      },
      tooltip: 'Сторона заявки (покупка/продажа)',
      minWidth: 85
    },
    {
      id: 'residue',
      displayName: 'Остаток',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => (b.filled ?? 0) - (a.filled ?? 0),
      tooltip: 'Отношение невыполненных заявок к общему количеству',
      minWidth: 70
    },
    {
      id: 'volume',
      displayName: 'Объем',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => (b.volume ?? 0) - (a.volume ?? 0),
      tooltip: 'Объем',
      minWidth: 60
    },
    {
      id: 'qty',
      displayName: 'Кол-во',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => b.qty - a.qty,
      tooltip: 'Количество заявок',
      minWidth: 65
    },
    {
      id: 'price',
      displayName: 'Цена',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => b.price - a.price,
      tooltip: 'Цена заявки',
      minWidth: 55
    },
    {
      id: 'status',
      displayName: 'Статус',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => a.status.localeCompare(b.status),
      filterData: {
        filterName: 'status',
        filterType: FilterType.DefaultMultiple,
        filters: [
          { text: 'Исполнена', value: 'filled' },
          { text: 'Активна', value: 'working' },
          { text: 'Отменена', value: 'canceled' },
          { text: 'Отложена', value: 'rejected' }
        ]
      },
      tooltip: 'Стаус заявки',
      minWidth: 80
    },
    {
      id: 'transTime',
      displayName: 'Время',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => Number(b.transTime) - Number(a.transTime),
      tooltip: 'Время выставления заявки',
      minWidth: 60
    },
    {
      id: 'exchange',
      displayName: 'Биржа',
      sortOrder: null,
      transformFn: data => data.targetInstrument.exchange,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => b.targetInstrument.exchange.localeCompare(a.targetInstrument.exchange),
      filterData: {
        filterName: 'exchange',
        filterType: FilterType.DefaultMultiple,
        filters: [
          { text: 'ММВБ', value: 'MOEX' },
          { text: 'СПБ', value: 'SPBX' }
        ]
      },
      tooltip: 'Наименование биржи',
      minWidth: 80
    },
    {
      id: 'type',
      displayName: 'Тип',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => b.type.localeCompare(a.type),
      filterData: {
        filterName: 'type',
        filterType: FilterType.DefaultMultiple,
        filters: [
          { text: 'Лимит', value: 'limit' },
          { text: 'Рыночн.', value: 'market' }
        ]
      },
      tooltip: 'Тип заявки (лимитная/рыночная)',
      minWidth: 65
    },
    {
      id: 'endTime',
      displayName: 'Действ. до.',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => Number(b.endTime) - Number(a.endTime),
      tooltip: 'Срок действия заявки',
      minWidth: 65
    },
  ];

  private orders: Order[] = [];

  settingsTableName = TableNames.OrdersTable;
  settingsColumnsName = ColumnsNames.OrdersColumns;
  fileSuffix = 'orders';

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    private readonly service: BlotterService,
    private readonly wsOrdersService: WsOrdersService,
    private readonly timezoneConverterService: TimezoneConverterService,
    protected readonly translatorService: TranslatorService,
    protected readonly nzContextMenuService: NzContextMenuService,
    private readonly ordersGroupService: OrdersGroupService,
    private readonly ordersDialogService: OrdersDialogService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(
      settingsService,
      translatorService,
      nzContextMenuService,
      destroyRef
    );
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected initTableConfigStream(): Observable<TableConfig<DisplayOrder>> {
    return this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.ordersTable, current.ordersTable)
        && previous.badgeColor === current.badgeColor
      ),
      mapWith(
        () => combineLatest([
          this.translatorService.getTranslator('blotter/orders'),
          this.translatorService.getTranslator('blotter/blotter-common')
        ]),
        (s, [tOrders, tCommon]) => ({s, tOrders, tCommon})
      ),
      takeUntilDestroyed(this.destroyRef),
      map(({ s, tOrders, tCommon }) => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(s.ordersTable, s.ordersColumns);

        return {
          columns: this.allColumns
            .map(c => ({column: c, columnSettings: tableSettings?.columns.find(x => x.columnId === c.id)}))
            .filter(c => c.columnSettings != null)
            .map((column, index) => ({
              ...column.column,
              displayName: tOrders(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
              tooltip: tOrders(['columns', column.column.id, 'tooltip'], {fallback: column.column.tooltip}),
              filterData: column.column.filterData
                ? {
                  ...column.column.filterData,
                  filterName: tOrders(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
                  filters: (column.column.filterData.filters ?? []).map(f => ({
                    value: f.value as unknown,
                    text: tCommon([column.column.id + 'Filters', f.value], {fallback: f.text})
                  }))
                }
                : undefined,
              width: column.columnSettings!.columnWidth ?? this.defaultColumnWidth,
              order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
            }))
            .sort((a, b) => a.order - b.order)
        };
      })
    );
  }

  protected initTableDataStream(): Observable<DisplayOrder[]> {
    const orders$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getOrders(settings)),
      debounceTime(100),
      startWith([]),
      tap((orders: Order[]) => this.orders = orders)
    );

    return combineLatest([
      orders$,
      this.filters$,
      this.timezoneConverterService.getConverter(),
      this.ordersGroupService.getAllOrderGroups()
    ]).pipe(
      map(([orders, f, converter, groups]) => orders
        .map(o => ({
          ...o,
          residue: `${o.filled}/${o.qty}`,
          transTime: converter.toTerminalDate(o.transTime),
          endTime: !!o.endTime ? converter.toTerminalDate(o.endTime) : o.endTime,
          groupId: groups.find(g => !!g.orders.find(go => go.orderId === o.id))?.id
        }))
        .filter(o => this.justifyFilter(o, f))
        .sort(this.sortOrders))
    );
  }

  rowClick(row: DisplayOrder): void {
    this.settings$
      .pipe(
        take(1)
      )
      .subscribe(s => this.service.selectNewInstrument(
        row.targetInstrument.symbol,
        row.targetInstrument.exchange,
        row.targetInstrument.instrumentGroup ?? null,
        s.badgeColor ?? defaultBadgeColor
      ));
  }

  cancelOrder(order: DisplayOrder): void {
    this.wsOrdersService.cancelOrders([
      {
        orderId: order.id,
        orderType: order.type,
        exchange: order.targetInstrument.exchange,
        portfolio: order.ownedPortfolio.portfolio
      }
    ]).subscribe();
  }

  editOrder(order: Order, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if(order.type !== OrderType.Limit) {
      return;
    }

    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.ordersDialogService.openEditOrderDialog({
        instrumentKey: order.targetInstrument,
        portfolioKey: {
          ...order.ownedPortfolio,
          marketType: order.ownedPortfolio.marketType ?? s.marketType
        },
        orderId: order.id,
        orderType: OrderFormType.Limit,
        initialValues: {
          price: order.price,
          quantity: order.qty - (order.filledQtyBatch ?? 0)
        }
      });
    });
  }

  cancelAllOrders(): void {
    const working = this.orders.filter(o => o.status == 'working');
    if(working.length > 0) {
      this.wsOrdersService.cancelOrders(working.map(o => ({
        orderId: o.id,
        orderType: o.type,
        exchange: o.targetInstrument.exchange,
        portfolio: o.ownedPortfolio.portfolio
      }))).subscribe();
    }
  }

  isMarketOrder(order: DisplayOrder): boolean {
    return order.type === OrderType.Market;
  }

  openOrdersGroup(groupId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.service.openOrderGroupModal(groupId);
  }

  protected rowToInstrumentKey(row: DisplayOrder): Observable<InstrumentKey | null> {
    return this.service.getInstrumentToSelect(
      row.targetInstrument.symbol,
      row.targetInstrument.exchange,
      row.targetInstrument.instrumentGroup ?? null
    );
  }

  private sortOrders(a: DisplayOrder, b: DisplayOrder): number {
    if (a.status == 'working' && b.status != 'working') {
      return -1;
    }
    else if (b.status == 'working' && a.status != 'working') {
      return 1;
    }
    if ((a.endTime ?? 0) < (b.endTime ?? 0)) {
      return -1;
    }
    else if ((a.endTime ?? 0) > (b.endTime ?? 0)) {
      return 1;
    }
    return 0;
  }
}
