import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  defer,
  distinctUntilChanged,
  Observable,
  switchMap,
  take,
} from 'rxjs';
import {
  debounceTime,
  map,
  startWith,
  tap
} from 'rxjs/operators';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {NzTableModule} from 'ng-zorro-antd/table';
import {
  CdkDrag,
  CdkDropList
} from '@angular/cdk/drag-drop';
import {NzPopconfirmDirective} from 'ng-zorro-antd/popconfirm';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  AsyncPipe,
  DecimalPipe
} from '@angular/common';
import {BlotterBaseTable} from '@terminal-widgets-lib/widgets/blotter/components/blotter-base-table/blotter-base-table';
import {StopOrder} from '@terminal-core-lib/features/portfolios/types/order.types';
import {OrderFilter} from '@terminal-widgets-lib/widgets/blotter/types/order-filter.types';
import {
  BaseColumnSettings,
  FilterType,
  TableConfig
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {DomHelper} from '@terminal-core-lib/common/utils/dom.helper';
import {OrderType} from '@terminal-core-lib/features/orders/types/orders.types';
import {ConditionHelper} from '@terminal-core-lib/common/utils/condition.helper';
import {Condition} from '@terminal-core-lib/common/types/condition.types';
import {
  ColumnsNames,
  TableNames
} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {BlotterService} from '@terminal-widgets-lib/widgets/blotter/services/blotter.service';
import {
  USER_CONTEXT,
  UserContext
} from '@terminal-core-lib/features/user-context/user-context.types';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {TimezoneConverterService} from '@terminal-core-lib/features/timezones/services/timezone-converter.service';
import {OrdersGroupService} from '@terminal-core-lib/features/orders/services/order-group.service';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {OrderFormType} from '@terminal-core-lib/features/orders/services/orders-dialog-service.types';
import {
  Permission,
  User
} from '@terminal-core-lib/features/user-context/user.types';
import {PermissionsHelper} from '@terminal-core-lib/features/user-context/utils/permissions.helper';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {WidgetSettingsHelper} from '@terminal-core-lib/features/widget-settings/utils/widget-settings.helper';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {TableRowHeight} from '@terminal-core-lib/common/directives/table-row-height';
import {ResizeColumn} from '@terminal-core-lib/common/directives/resize-column';
import {InstrumentBadgeDisplay} from '@terminal-core-lib/common/components/instrument-badge-display/instrument-badge-display';
import {TableSearchFilter} from '@terminal-core-lib/features/tables/components/table-search-filter/table-search-filter';
import {AddToWatchlistMenu} from '@terminal-core-lib/features/watchlist/components/add-to-watchlist-menu/add-to-watchlist-menu';
import {BlotterOrdersGroupModal} from '@terminal-widgets-lib/widgets/blotter/components/blotter-orders-group-modal/blotter-orders-group-modal';

interface DisplayOrder extends StopOrder {
  residue: string;
  volume: number | null;
}

@Component({
  selector: 'ats-blotter-stop-orders',
  templateUrl: './blotter-stop-orders.html',
  styleUrls: ['./blotter-stop-orders.less'],
  imports: [
    TranslocoDirective,
    LetDirective,
    NzEmptyComponent,
    NzResizeObserverDirective,
    CdkDropList,
    NzPopconfirmDirective,
    CdkDrag,
    NzTooltipDirective,
    NzIconDirective,
    NzButtonComponent,
    NzDropdownMenuComponent,
    DecimalPipe,
    NzTableModule,
    AsyncPipe,
    TableRowHeight,
    ResizeColumn,
    InstrumentBadgeDisplay,
    TableSearchFilter,
    AddToWatchlistMenu,
    BlotterOrdersGroupModal
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BlotterStopOrders extends BlotterBaseTable<DisplayOrder, OrderFilter> implements OnInit {
  readonly orderTypes = OrderType;

  readonly shouldShowSettingsChange = output<boolean>();

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
          {text: 'Покупка', value: 'buy'},
          {text: 'Продажа', value: 'sell'}
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
      tooltip: 'Цена',
      minWidth: 55
    },
    {
      id: 'triggerPrice',
      displayName: 'Сигн. цена',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => b.triggerPrice - a.triggerPrice,
      tooltip: 'Сигнальная цена (заявка выставится, когда цена упадёт/поднимется до указанного значения)',
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
          {text: 'Исполнена', value: 'filled'},
          {text: 'Активна', value: 'working'},
          {text: 'Отменена', value: 'canceled'},
          {text: 'Отложена', value: 'rejected'}
        ]
      },
      tooltip: 'Стаус заявки',
      minWidth: 80
    },
    {
      id: 'conditionType',
      displayName: 'Условие',
      sortOrder: null,
      sortFn: (a: DisplayOrder, b: DisplayOrder): number => a.conditionType.localeCompare(b.conditionType),
      filterData: {
        filterName: 'conditionType',
        filterType: FilterType.DefaultMultiple,
        filters: [
          {text: ConditionHelper.getConditionSign(Condition.More)!, value: 'more'},
          {text: ConditionHelper.getConditionSign(Condition.Less)!, value: 'less'},
          {text: ConditionHelper.getConditionSign(Condition.MoreOrEqual)!, value: 'moreorequal'},
          {text: ConditionHelper.getConditionSign(Condition.LessOrEqual)!, value: 'lessorequal'}
        ]
      },
      tooltip: 'Условие, при котором будет выставлена заявка',
      minWidth: 85
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
          {text: 'ММВБ', value: 'MOEX'},
          {text: 'СПБ', value: 'SPBX'}
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
          {text: 'Лимит', value: 'stoplimit'},
          {text: 'Рыночн.', value: 'stop'}
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

  override settingsTableName = TableNames.StopOrdersTable;

  override settingsColumnsName = ColumnsNames.StopOrdersColumns;

  override fileSuffix = 'stopOrders';

  protected readonly groupIdToView = model<string | null>(null);

  protected readonly service = inject(BlotterService);

  protected readonly userContext = inject<UserContext>(USER_CONTEXT);

  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  private readonly ordersDialogService = inject(OrdersDialogService);

  private readonly timezoneConverterService = inject(TimezoneConverterService);

  private readonly ordersGroupService = inject(OrdersGroupService);

  private orders: StopOrder[] = [];

  get restoreFiltersAndSortOnLoad(): boolean {
    return true;
  }

  override rowClick(row: DisplayOrder): void {
    this.settings$
      .pipe(
        take(1)
      )
      .subscribe(s => this.service.selectNewInstrument(
        row.targetInstrument.symbol,
        row.targetInstrument.exchange,
        row.targetInstrument.instrumentGroup ?? null,
        s.badgeColor ?? DefaultBadge
      ));
  }

  cancelOrder(order: DisplayOrder): void {
    this.orderCommandService.cancelOrders([
      {
        orderId: order.id,
        orderType: order.type,
        exchange: order.targetInstrument.exchange,
        portfolio: order.ownedPortfolio.portfolio
      }
    ]).subscribe();
  }

  editOrder(order: StopOrder, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

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
        orderType: OrderFormType.Stop,
        initialValues: {}
      });
    });
  }

  cancelAllOrders(): void {
    const working = this.orders.filter(o => o.status == 'working');
    if (working.length > 0) {
      this.orderCommandService.cancelOrders(working.map(o => ({
        orderId: o.id,
        orderType: o.type,
        exchange: o.targetInstrument.exchange,
        portfolio: o.ownedPortfolio.portfolio
      }))).subscribe();
    }
  }

  openOrdersGroup(groupId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.groupIdToView.set(groupId);
  }

  getConditionSign(condition: string): string {
    return ConditionHelper.getConditionSign(ConditionHelper.getConditionTypeByString(condition)!) ?? '';
  }

  protected canCancelOrders(user: User | null): boolean {
    return user == null
      ? true
      : PermissionsHelper.hasPermission(user, Permission.CancelOrder);
  }

  protected canEditOrders(user: User | null): boolean {
    return user == null
      ? true
      : PermissionsHelper.hasPermission(user, Permission.EditOrder);
  }

  protected initTableConfigStream(): Observable<TableConfig<DisplayOrder>> {
    const tableSettings$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.stopOrdersTable, current.stopOrdersTable)
        && previous.badgeColor === current.badgeColor
      )
    );

    const tableState$ = defer(() => {
      return combineLatest({
        filters: this.getFiltersState().pipe(take(1)),
        sort: this.getSortState().pipe(take(1))
      });
    });

    return combineLatest({
      tableSettings: tableSettings$,
      tStopOrders: this.translatorService.getTranslator('blotter/stop-orders'),
      tCommon: this.translatorService.getTranslator('blotter/blotter-common')
    }).pipe(
      mapWith(() => tableState$, (source, output) => ({...source, ...output})),
      takeUntilDestroyed(this.destroyRef),
      tap(x => {
        if (x.filters != null) {
          this.filterChange(x.filters);
        }
      }),
      map(x => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(x.tableSettings.stopOrdersTable, x.tableSettings.stopOrdersColumns);

        return {
          columns: this.allColumns
            .map(c => ({column: c, columnSettings: tableSettings?.columns.find(x => x.columnId === c.id)}))
            .filter(c => !!c.columnSettings)
            .map((column, index) => ({
              ...column.column,
              displayName: x.tStopOrders(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
              tooltip: x.tStopOrders(['columns', column.column.id, 'tooltip'], {fallback: column.column.tooltip}),
              filterData: column.column.filterData
                ? {
                  ...column.column.filterData,
                  filterName: x.tStopOrders(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
                  filters: (column.column.filterData.filters ?? []).map(f => ({
                    value: f.value as unknown,
                    text: x.tCommon([column.column.id + 'Filters', f.value], {fallback: f.text}),
                    byDefault: this.isFilterItemApplied(column.column.id, x.filters, f)
                  })),
                  initialValue: x.filters?.[column.column.id]
                }
                : undefined,
              sortOrder: this.getSort(column.column.id, x.sort),
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
      distinctUntilChanged((previous, current) => WidgetSettingsHelper.isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getStopOrders(settings)),
      debounceTime(100),
      startWith([]),
      tap(orders => this.orders = orders)
    );

    return combineLatest([
      orders$,
      this.filters$,
      this.timezoneConverterService.getConverter(),
      this.ordersGroupService.getAllOrderGroups()
    ]).pipe(
      map(([orders, f, converter, groups]) => orders
        .map((o: StopOrder) => ({
          ...o,
          residue: `${o.filledQtyBatch ?? 0}/${o.qty}`,
          transTime: converter.toTerminalDate(o.transTime),
          endTime: o.endTime ? converter.toTerminalDate(o.endTime) : o.endTime,
          groupId: groups.find(g => !!g.orders.find(go => go.orderId === o.id))?.id
        }))
        .filter(o => this.justifyFilter(o, f))
        .sort(this.sortOrders))
    );
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
    } else if (b.status == 'working' && a.status != 'working') {
      return 1;
    }
    if ((a.endTime ?? 0) < (b.endTime ?? 0)) {
      return -1;
    } else if ((a.endTime ?? 0) > (b.endTime ?? 0)) {
      return 1;
    }
    return 0;
  }
}
