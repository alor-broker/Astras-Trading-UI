import {Component, DestroyRef, inject} from '@angular/core';
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
import {catchError, filter, map, startWith, switchMap} from "rxjs/operators";
import {
  OrderExecuteSubscription,
  PriceSparkSubscription,
  PushSubscriptionType,
  SubscriptionBase
} from "../../../push-notifications/models/push-notifications.model";
import {allNotificationsColumns, TableNames} from "../../models/blotter-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {BlotterService} from "../../services/blotter.service";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {isArrayEqual} from "../../../../shared/utils/collections";
import {PushNotificationsService} from "../../../push-notifications/services/push-notifications.service";
import {BaseColumnSettings, FilterType} from "../../../../shared/models/settings/table-settings.model";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {BlotterBaseTableComponent} from "../blotter-base-table/blotter-base-table.component";
import {TableConfig} from "../../../../shared/models/table-config.model";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {ErrorHandlerService} from "../../../../shared/services/handle-error/error-handler.service";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {LetDirective} from '@ngrx/component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {NzTableModule} from 'ng-zorro-antd/table';
import {TableRowHeightDirective} from '../../../../shared/directives/table-row-height.directive';
import {CdkDrag, CdkDropList} from '@angular/cdk/drag-drop';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {ResizeColumnDirective} from '../../../../shared/directives/resize-column.directive';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  InstrumentBadgeDisplayComponent
} from '../../../../shared/components/instrument-badge-display/instrument-badge-display.component';
import {
  TableSearchFilterComponent
} from '../../../../shared/components/table-search-filter/table-search-filter.component';
import {
  AddToWatchlistMenuComponent
} from '../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {AsyncPipe} from '@angular/common';

interface NotificationFilter {
  id?: string;
  subscriptionType?: string[];
  instrument?: string;

  [key: string]: string | string[] | undefined;
}

type DisplayNotification = Partial<OrderExecuteSubscription> & Partial<PriceSparkSubscription> & { id: string };

@Component({
  selector: 'ats-push-notifications',
  templateUrl: './push-notifications.component.html',
  styleUrls: ['./push-notifications.component.less'],
  imports: [
    TranslocoDirective,
    NzEmptyComponent,
    LetDirective,
    NzResizeObserverDirective,
    TableRowHeightDirective,
    CdkDropList,
    NzTooltipDirective,
    ResizeColumnDirective,
    CdkDrag,
    NzIconDirective,
    InstrumentBadgeDisplayComponent,
    NzDropdownMenuComponent,
    TableSearchFilterComponent,
    AddToWatchlistMenuComponent,
    NzTypographyComponent,
    AsyncPipe,
    NzTableModule
  ]
})
export class PushNotificationsComponent extends BlotterBaseTableComponent<DisplayNotification, NotificationFilter> {
  readonly subscriptionTypes = PushSubscriptionType;
  isNotificationsAllowed$!: Observable<boolean>;
  isLoading$ = new BehaviorSubject<boolean>(false);
  settingsTableName = TableNames.NotificationsTable;
  protected readonly widgetSettingsService: WidgetSettingsService;
  protected readonly blotterService = inject(BlotterService);
  protected readonly translatorService: TranslatorService;
  protected readonly nzContextMenuService: NzContextMenuService;
  protected readonly widgetLocalStateService: WidgetLocalStateService;
  protected readonly destroyRef: DestroyRef;
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

  constructor() {
    const widgetSettingsService = inject(WidgetSettingsService);
    const translatorService = inject(TranslatorService);
    const nzContextMenuService = inject(NzContextMenuService);
    const widgetLocalStateService = inject(WidgetLocalStateService);
    const destroyRef = inject(DestroyRef);

    super(
      widgetSettingsService,
      translatorService,
      nzContextMenuService,
      widgetLocalStateService,
      destroyRef
    );

    this.widgetSettingsService = widgetSettingsService;
    this.translatorService = translatorService;
    this.nzContextMenuService = nzContextMenuService;
    this.widgetLocalStateService = widgetLocalStateService;
    this.destroyRef = destroyRef;
  }

  get restoreFiltersAndSortOnLoad(): boolean {
    return false;
  }

  rowClick(row: DisplayNotification): void {
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
        s.badgeColor ?? defaultBadgeColor
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
      distinctUntilChanged((prev, cur) => isArrayEqual(
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
