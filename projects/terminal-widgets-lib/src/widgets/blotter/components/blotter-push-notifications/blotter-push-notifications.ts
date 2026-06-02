import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  defer,
  distinctUntilChanged,
  fromEvent,
  Observable,
  of,
  shareReplay,
  take,
  tap
} from "rxjs";
import {
  catchError,
  filter,
  map,
  startWith,
  switchMap
} from "rxjs/operators";
import {BlotterService} from "../../services/blotter.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {LetDirective} from '@ngrx/component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {NzTableModule} from 'ng-zorro-antd/table';
import {
  CdkDrag,
  CdkDropList
} from '@angular/cdk/drag-drop';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {AsyncPipe} from '@angular/common';
import {
  OrderExecuteSubscription,
  PriceSparkSubscription,
  PushSubscriptionType,
  SubscriptionBase
} from '@terminal-core-lib/features/push-notifications/types/push-notifications.types';
import {BlotterBaseTable} from '@terminal-widgets-lib/widgets/blotter/components/blotter-base-table/blotter-base-table';
import {
  allNotificationsColumns,
  TableNames
} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {
  BaseColumnSettings,
  FilterType,
  TableConfig
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {PushNotificationsService} from '@terminal-core-lib/features/push-notifications/services/push-notifications.service';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {ResizeColumn} from '@terminal-core-lib/common/directives/resize-column';
import {TableRowHeight} from '@terminal-core-lib/common/directives/table-row-height';
import {InstrumentBadgeDisplay} from '@terminal-core-lib/common/components/instrument-badge-display/instrument-badge-display';
import {AddToWatchlistMenu} from '@terminal-core-lib/features/watchlist/components/add-to-watchlist-menu/add-to-watchlist-menu';
import {TableSearchFilter} from '@terminal-core-lib/features/tables/components/table-search-filter/table-search-filter';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {ArrayHelper} from '@terminal-core-lib/common/utils/array.helper';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';

interface NotificationFilter {
  id?: string;
  subscriptionType?: string[];
  instrument?: string;

  [key: string]: string | string[] | undefined;
}

type DisplayNotification = Partial<OrderExecuteSubscription> & Partial<PriceSparkSubscription> & { id: string };

@Component({
  selector: 'ats-blotter-push-notifications',
  templateUrl: './blotter-push-notifications.html',
  styleUrls: ['./blotter-push-notifications.less'],
  imports: [
    TranslocoDirective,
    LetDirective,
    NzEmptyComponent,
    NzResizeObserverDirective,
    CdkDropList,
    ResizeColumn,
    CdkDrag,
    NzTooltipDirective,
    NzDropdownMenuComponent,
    NzTableModule,
    AsyncPipe,
    TableRowHeight,
    InstrumentBadgeDisplay,
    AddToWatchlistMenu,
    TableSearchFilter,
    NzIconDirective,
    NzTypographyComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BlotterPushNotifications extends BlotterBaseTable<DisplayNotification, NotificationFilter> {
  readonly subscriptionTypes = PushSubscriptionType;

  isNotificationsAllowed$!: Observable<boolean>;

  isLoading$ = new BehaviorSubject<boolean>(false);

  override settingsTableName = TableNames.NotificationsTable;

  protected readonly blotterService = inject(BlotterService);

  protected readonly allColumns: BaseColumnSettings<DisplayNotification>[] = [
    {
      id: 'id',
      displayName: 'Id',
      filterData: {
        filterName: 'id',
        filterType: FilterType.Search
      }
    },
    {
      id: 'subscriptionType',
      displayName: 'subscriptionType',
      filterData: {
        filterName: 'subscriptionType',
        filterType: FilterType.DefaultMultiple,
        filters: [
          {value: 'OrderExecute', text: 'OrderExecute'},
          {value: 'PriceSpark', text: 'PriceSpark'},
        ]
      }
    },
    {
      id: 'instrument',
      displayName: 'instrument',
      filterData: {
        filterName: 'instrument',
        filterType: FilterType.Search
      }
    },
    {
      id: 'priceCondition',
      displayName: 'priceCondition',
    },
    {
      id: 'price',
      displayName: 'price',
      sortFn: (a, b): number => {
        return (a.price ?? -1) - (b.price ?? -1);
      }
    },
  ];

  private readonly pushNotificationsService = inject(PushNotificationsService);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  get restoreFiltersAndSortOnLoad(): boolean {
    return false;
  }

  override rowClick(row: DisplayNotification): void {
    if (row.subscriptionType !== PushSubscriptionType.PriceSpark) {
      return;
    }
    this.settings$
      .pipe(
        take(1)
      )
      .subscribe(s => this.blotterService.selectNewInstrument(
        row.instrument!,
        row.exchange!,
        null,
        s.badgeColor ?? DefaultBadge
      ));
  }

  cancelSubscription(id: string): void {
    this.isLoading$.next(true);
    this.pushNotificationsService.cancelSubscription(id).pipe(
      take(1)
    ).subscribe();
  }

  protected initTableConfigStream(): Observable<TableConfig<DisplayNotification>> {
    const tableSettings$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.notificationsTable, current.notificationsTable)
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
      translator: this.translatorService.getTranslator('blotter/notifications')
    }).pipe(
      mapWith(() => tableState$, (source, output) => ({...source, ...output})),
      takeUntilDestroyed(this.destroyRef),
      tap(x => {
        if (x.filters != null) {
          this.filterChange(x.filters);
        }
      }),
      map(x => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(x.tableSettings.notificationsTable, allNotificationsColumns.filter(c => c.isDefault).map(c => c.id));

        return {
          columns: this.allColumns
            .map(c => ({column: c, columnSettings: tableSettings?.columns.find(x => x.columnId === c.id)}))
            .filter(c => !!c.columnSettings)
            .map((column, index) => ({
              ...column.column,
              displayName: x.translator(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
              tooltip: x.translator(['columns', column.column.id, 'tooltip'], {fallback: column.column.tooltip}),
              filterData: column.column.filterData
                ? {
                  ...column.column.filterData,
                  filterName: x.translator(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
                  filters: (column.column.filterData.filters ?? []).map(f => ({
                    value: f.value as unknown,
                    text: x.translator(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text}),
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

  protected initTableDataStream(): Observable<DisplayNotification[]> {
    this.initNotificationStatusCheck();

    const currentPositions$ = this.settings$.pipe(
      switchMap(s => this.blotterService.getPositions(s)),
      map(p => p.map(p => p.targetInstrument)
      ),
      distinctUntilChanged((prev, cur) => ArrayHelper.isArrayEqual(
        prev,
        cur,
        (a, b) => a.symbol === b.symbol && a.exchange === b.exchange)
      )
    );

    const currentSubscriptions$ = combineLatest([
      this.pushNotificationsService.subscriptionsUpdated$.pipe(startWith({})),
      this.pushNotificationsService.getMessages().pipe(startWith({})),
      fromEvent(document, 'visibilitychange')
        .pipe(
          filter(() => document.visibilityState === 'visible'),
          startWith(null)
        )
    ]).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap(() => this.pushNotificationsService.getCurrentSubscriptions())
    );

    const displayNotifications$ = combineLatest([
      this.settings$,
      currentPositions$,
      currentSubscriptions$,
      this.filters$
    ]).pipe(
      map(([
             settings,
             positions,
             subscriptions,
             filter
           ]) => {
        const blotterSubscriptions = ((subscriptions as SubscriptionBase[] | null) ?? []).filter(s => {
          if (s.subscriptionType === PushSubscriptionType.OrderExecute) {
            const orderSubscription = <OrderExecuteSubscription>s;
            return orderSubscription.exchange === settings.exchange
              && orderSubscription.portfolio === settings.portfolio;
          }

          if ((s.subscriptionType as PushSubscriptionType) === PushSubscriptionType.PriceSpark) {
            const priceSparkSubscription = <PriceSparkSubscription>s;
            return !!positions.find(p => p.symbol === priceSparkSubscription.instrument && p.exchange === priceSparkSubscription.exchange);
          }

          return true;
        });

        return blotterSubscriptions.map(s => ({
            ...s,
            price: s.subscriptionType !== PushSubscriptionType.PriceSpark ? undefined : (<PriceSparkSubscription>s).price
          } as DisplayNotification)
        ).filter(s => this.justifyFilter(s, filter))
          .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
      }),
      tap(() => this.isLoading$.next(false))
    );

    return this.isNotificationsAllowed$.pipe(
      filter(x => x),
      switchMap(() => displayNotifications$),
      catchError(err => {
        this.errorHandlerService.handleError(err);
        return of([]);
      })
    );
  }

  protected rowToInstrumentKey(row: DisplayNotification): Observable<InstrumentKey | null> {
    if (row.instrument != null && row.exchange != null) {
      return of({
        symbol: row.instrument,
        exchange: row.exchange,
        instrumentGroup: row.board
      });
    }

    return of(null);
  }

  private initNotificationStatusCheck(): void {
    this.isNotificationsAllowed$ = this.pushNotificationsService.getBrowserNotificationsStatus().pipe(
      map(s => s === "granted"),
      shareReplay(1)
    );
  }
}
