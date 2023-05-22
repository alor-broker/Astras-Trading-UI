import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  take,
  takeUntil,
  tap
} from "rxjs";
import {InstrumentGroups} from "../../../../shared/models/dashboard/dashboard.model";
import {filter, map, startWith, switchMap} from "rxjs/operators";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {TerminalSettingsService} from "../../../terminal-settings/services/terminal-settings.service";
import {TableAutoHeightBehavior} from "../../utils/table-auto-height.behavior";
import {
  OrderExecuteSubscription,
  PriceSparkSubscription,
  PushSubscriptionType,
  SubscriptionBase
} from "../../../push-notifications/models/push-notifications.model";
import {allNotificationsColumns, BlotterSettings} from "../../models/blotter-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {BlotterService} from "../../services/blotter.service";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {isArrayEqual} from "../../../../shared/utils/collections";
import {PushNotificationsService} from "../../../push-notifications/services/push-notifications.service";
import {BaseColumnSettings} from "../../../../shared/models/settings/table-settings.model";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {NzTableFilterList} from "ng-zorro-antd/table/src/table.types";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {Destroyable} from "../../../../shared/utils/destroyable";
import {CdkDragDrop} from "@angular/cdk/drag-drop";
import {BlotterTablesHelper} from "../../utils/blotter-tables.helper";

interface NotificationFilter {
  id?: string,
  subscriptionType?: string[],
  instrument?: string
}

type DisplayNotification = Partial<OrderExecuteSubscription> & Partial<PriceSparkSubscription>;

@Component({
  selector: 'ats-push-notifications[guid]',
  templateUrl: './push-notifications.component.html',
  styleUrls: ['./push-notifications.component.less']
})
export class PushNotificationsComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly subscriptionTypes = PushSubscriptionType;
  readonly isLoading$ = new BehaviorSubject(false);

  @ViewChildren('tableContainer')
  tableContainer!: QueryList<ElementRef<HTMLElement>>;
  tableInnerWidth: number = 1000;
  displayNotifications$: Observable<DisplayNotification[]> = of([]);
  @Input()
  guid!: string;
  selectedInstruments$: Observable<InstrumentGroups> = of({});
  readonly scrollHeight$ = new BehaviorSubject<number>(100);
  listOfColumns: BaseColumnSettings<DisplayNotification>[] = [];
  isNotificationsAllowed$!: Observable<boolean>;
  readonly filter$ = new BehaviorSubject<NotificationFilter>({});
  private readonly columnDefaultWidth = 100;
  private readonly destroyable = new Destroyable();
  private badgeColor = defaultBadgeColor;
  private settings$!: Observable<BlotterSettings>;
  private readonly allColumns: BaseColumnSettings<DisplayNotification>[] = [
    {
      id: 'id',
      displayName: 'Id',
      filterData: {
        filterName: 'id',
        isDefaultFilter: false
      }
    },
    {
      id: 'subscriptionType',
      displayName: 'subscriptionType',
      filterData: {
        filterName: 'subscriptionType',
        isDefaultFilter: true,
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
        filterName: 'instrument'
      }
    },
    {
      id: 'priceCondition',
      displayName: 'priceCondition',
    },
    {
      id: 'price',
      displayName: 'price',
      sortFn: (a, b) => {
        return (a.price ?? -1) - (b.price ?? -1);
      }
    },
  ];

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly blotterService: BlotterService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly translatorService: TranslatorService) {
  }

  isFilterEmpty = () => Object.keys(this.filter$.getValue()).length === 0;

  ngAfterViewInit(): void {
    const initHeightWatching = (ref: ElementRef<HTMLElement>) => {
      TableAutoHeightBehavior.getScrollHeight(ref).pipe(
        takeUntil(this.destroyable)
      ).subscribe(x => this.scrollHeight$.next(x));
    };

    if (this.tableContainer.length > 0) {
      initHeightWatching(this.tableContainer!.first);
    } else {
      this.tableContainer.changes.pipe(
        take(1)
      ).subscribe((x: QueryList<ElementRef<HTMLElement>>) => {
        initHeightWatching(x.first);
      });
    }
  }

  trackBy(index: number, notification: DisplayNotification): string {
    return notification.id!;
  }

  ngOnDestroy(): void {
    this.destroyable.destroy();
    this.isLoading$.complete();
    this.scrollHeight$.complete();
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<BlotterSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.initColumns();
    this.initSelectedInstruments();
    this.initNotificationStatusCheck();
    this.initDisplayNotifications();
  }

  selectInstrument(notification: SubscriptionBase) {
    if (notification.subscriptionType !== PushSubscriptionType.PriceSpark) {
      return;
    }

    const priceSparkSubscription = <PriceSparkSubscription>notification;

    this.blotterService.selectNewInstrument(priceSparkSubscription.instrument, priceSparkSubscription.exchange, this.badgeColor);
  }

  changeColumnOrder(event: CdkDragDrop<any>) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      this.widgetSettingsService.updateSettings<BlotterSettings>(
        settings.guid,
        {
          notificationsTable: BlotterTablesHelper.changeColumnOrder(
            event,
            settings.notificationsTable ?? TableSettingHelper.toTableDisplaySettings(allNotificationsColumns.filter(c => c.isDefault).map(c => c.id))!,
            this.listOfColumns
          )
        }
      );
    });
  }

  saveColumnWidth(id: string, width: number) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      const tableSettings = settings.notificationsTable ?? TableSettingHelper.toTableDisplaySettings(allNotificationsColumns.filter(c => c.isDefault).map(c => c.id));
      if (tableSettings) {
        this.widgetSettingsService.updateSettings<BlotterSettings>(
          settings.guid,
          {
            notificationsTable: TableSettingHelper.updateColumn(
              id,
              tableSettings,
              {
                columnWidth: width
              }
            )
          }
        );
      }
    });
  }

  recalculateTableWidth(widthChange: { columnWidth: number, delta: number | null }) {
    const delta = widthChange.delta ?? widthChange.columnWidth - this.columnDefaultWidth;
    this.tableInnerWidth += delta;
  }

  defaultFilterChange(key: string, value: string[]) {
    this.applyFilter({[key]: value});
  }

  applyFilter(newFilter: NotificationFilter) {
    this.filter$.next({
      ...this.filter$.getValue(),
      ...newFilter
    });
  }

  isFilterApplied(column: BaseColumnSettings<DisplayNotification>) {
    const filter = this.filter$.getValue();
    return column.id in filter && !!filter[column.id as keyof NotificationFilter];
  }

  cancelSubscription(id: string) {
    this.isLoading$.next(true);
    this.pushNotificationsService.cancelSubscription(id).pipe(
      take(1)
    ).subscribe();
  }

  private initColumns() {
    this.settings$.pipe(
      distinctUntilChanged((previous, current) => TableSettingHelper.isTableSettingsEqual(previous?.notificationsTable, current.notificationsTable)),
      mapWith(
        () => this.translatorService.getTranslator('blotter/notifications'),
        (s, t) => ({s, t})
      ),
      takeUntil(this.destroyable)
    ).subscribe(({s, t}) => {
      const tableSettings = s.notificationsTable ?? TableSettingHelper.toTableDisplaySettings(allNotificationsColumns.filter(c => c.isDefault).map(c => c.id));

      if (tableSettings) {
        this.listOfColumns = this.allColumns
          .map(c => ({column: c, columnSettings: tableSettings.columns.find(x => x.columnId === c.id)}))
          .filter(c => !!c.columnSettings)
          .map((column, index) => ({
            ...column.column,
            displayName: t(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
            tooltip: t(['columns', column.column.id, 'tooltip'], {fallback: column.column.tooltip}),
            filterData: column.column.filterData
              ? {
                ...column.column.filterData,
                filterName: t(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
                filters: (<NzTableFilterList>column.column.filterData?.filters ?? []).map(f => ({
                  value: f.value,
                  text: t(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text})
                }))
              }
              : undefined,
            width: column.columnSettings!.columnWidth ?? this.columnDefaultWidth,
            order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
          }))
          .sort((a, b) => a.order - b.order);

        this.tableInnerWidth = this.listOfColumns.reduce((prev, cur) => prev + cur.width!, 0) + 70;
      }

      this.badgeColor = s.badgeColor!;
    });
  }

  private initSelectedInstruments() {
    this.selectedInstruments$ = combineLatest([
      this.dashboardContextService.instrumentsSelection$,
      this.terminalSettingsService.getSettings()
    ]).pipe(
      map(([badges, settings]) => {
        if (settings.badgesBind) {
          return badges;
        }
        return {[defaultBadgeColor]: badges[defaultBadgeColor]};
      })
    );
  }

  private initDisplayNotifications() {
    const currentPositions$ = this.settings$.pipe(
      switchMap(s => this.blotterService.getPositions(s)),
      map(p => p.map(p => ({
          symbol: p.symbol,
          exchange: p.exchange
        } as InstrumentKey))
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
    ]).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap(() => this.pushNotificationsService.getCurrentSubscriptions())
    );

    const displayNotifications$ = combineLatest([
      this.settings$,
      currentPositions$,
      currentSubscriptions$,
      this.filter$
    ]).pipe(
      map(([
             settings,
             positions,
             subscriptions,
             filter
           ]) => {

        const blotterSubscriptions = (subscriptions ?? []).filter(s => {
          if (s.subscriptionType === PushSubscriptionType.OrderExecute) {
            const orderSubscription = <OrderExecuteSubscription>s;
            return orderSubscription.exchange === settings.exchange
              && orderSubscription.portfolio === settings.portfolio;
          }

          if (s.subscriptionType === PushSubscriptionType.PriceSpark) {
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
          .sort((a, b) =>  b.createdAt!.getTime() - a.createdAt!.getTime());
      }),
      tap(() => this.isLoading$.next(false))
    );

    this.displayNotifications$ = this.isNotificationsAllowed$.pipe(
      filter(x=> x),
      switchMap(() => displayNotifications$)
    );
  }

  private initNotificationStatusCheck() {
    this.isNotificationsAllowed$ = this.pushNotificationsService.getBrowserNotificationsStatus().pipe(
      map(s => s === "granted"),
      shareReplay(1)
    );
  }

  private justifyFilter(order: DisplayNotification, filter: NotificationFilter): boolean {
    let isFiltered = true;
    for (const key of Object.keys(filter)) {
      const filterValue = filter[key as keyof NotificationFilter];
      if (filter[key as keyof NotificationFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        if (
          !column!.filterData!.isDefaultFilter && !this.searchInNotification(order, <keyof DisplayNotification>key, <string>filterValue) ||
          column!.filterData!.isDefaultFilter && filterValue?.length && !filterValue?.includes(order[<keyof DisplayNotification>key]!.toString())
        ) {
          isFiltered = false;
        }
      }
    }

    return isFiltered;
  }

  private searchInNotification(order: DisplayNotification, key: keyof DisplayNotification, value?: string): boolean {
    if (!value) {
      return true;
    }

    return order[key]?.toString()?.toLowerCase()?.includes(value.toLowerCase()) ?? false;
  }
}
