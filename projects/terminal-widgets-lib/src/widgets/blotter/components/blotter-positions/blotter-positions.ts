import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  defer,
  distinctUntilChanged,
  Observable,
  shareReplay,
  switchMap,
  take,
  tap
} from 'rxjs';
import {
  debounceTime,
  map,
  mergeMap,
  startWith
} from 'rxjs/operators';
import {BlotterService} from '../../services/blotter.service';
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
import {NzPopconfirmDirective} from 'ng-zorro-antd/popconfirm';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {DecimalPipe} from '@angular/common';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {PositionFilter} from '@terminal-widgets-lib/widgets/blotter/types/position-filter.types';
import {BlotterBaseTable} from '@terminal-widgets-lib/widgets/blotter/components/blotter-base-table/blotter-base-table';
import {MarketType} from '@terminal-core-lib/common/types/portfolio.types';
import {
  BaseColumnSettings,
  FilterType,
  TableConfig
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {
  BlotterWidgetSettings,
  ColumnsNames,
  TableNames
} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {USER_CONTEXT} from '@terminal-core-lib/features/user-context/user-context.types';
import {MarginOrderConfirmationService} from '@terminal-core-lib/features/orders/services/margin-order-notification.service';
import {WidgetSettingsHelper} from '@terminal-core-lib/features/widget-settings/utils/widget-settings.helper';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {CommonOrderCommands} from '@terminal-core-lib/features/orders/utils/common-order-commands';
import {
  Permission,
  User
} from '@terminal-core-lib/features/user-context/user.types';
import {PermissionsHelper} from '@terminal-core-lib/features/user-context/utils/permissions.helper';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {ResizeColumn} from '@terminal-core-lib/common/directives/resize-column';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';
import {InstrumentBadgeDisplay} from '@terminal-core-lib/common/components/instrument-badge-display/instrument-badge-display';
import {TableSearchFilter} from '@terminal-core-lib/features/tables/components/table-search-filter/table-search-filter';
import {AddToWatchlistMenu} from '@terminal-core-lib/features/watchlist/components/add-to-watchlist-menu/add-to-watchlist-menu';

interface PositionDisplay extends Position {
  id: string;
  volume: number;
  dailyUnrealisedPlRatio: number;
  unrealisedPlRatio: number;
}

@Component({
  selector: 'ats-blotter-positions',
  templateUrl: './blotter-positions.html',
  styleUrls: ['./blotter-positions.less'],
  imports: [
    TranslocoDirective,
    NzEmptyComponent,
    LetDirective,
    NzResizeObserverDirective,
    CdkDropList,
    NzPopconfirmDirective,
    NzIconDirective,
    CdkDrag,
    NzTooltipDirective,
    NzButtonComponent,
    NzDropdownMenuComponent,
    DecimalPipe,
    NzTableModule,
    ResizeColumn,
    InstrumentIcon,
    InstrumentBadgeDisplay,
    TableSearchFilter,
    AddToWatchlistMenu
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BlotterPositions extends BlotterBaseTable<PositionDisplay, PositionFilter> implements OnInit {
  readonly marketType = input<MarketType | null>();

  portfolioTotalCost$!: Observable<number>;

  readonly shouldShowSettingsChange = output<boolean>();

  override readonly allColumns: BaseColumnSettings<PositionDisplay>[] = [
    {
      id: 'icon',
      displayName: 'Значок',
      sortOrder: null,
      sortFn: null,
      hideTitle: true,
      width: 30,
      minWidth: 25,
      order: 0
    },
    {
      id: 'symbol',
      displayName: 'Тикер',
      sortOrder: null,
      transformFn: data => data.targetInstrument.symbol,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => a.targetInstrument.symbol.localeCompare(b.targetInstrument.symbol),
      filterData: {
        filterName: 'symbol',
        filterType: FilterType.Search
      },
      tooltip: 'Биржевой идентификатор ценной бумаги',
      minWidth: 75
    },
    {
      id: 'shortName',
      displayName: 'Имя',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => a.shortName.localeCompare(b.shortName),
      filterData: {
        filterName: 'shortName',
        filterType: FilterType.Search
      },
      tooltip: 'Наименование позиции',
      minWidth: 70
    },
    {
      id: 'avgPrice',
      displayName: 'Средняя',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => Number(a.avgPrice) - Number(b.avgPrice),
      tooltip: 'Средняя цена',
      minWidth: 70
    },
    {
      id: 'shareOfPortfolio',
      displayName: 'Доля, %',
      sortOrder: null,
      tooltip: 'Доля от общей ценности портфеля',
      minWidth: 70
    },
    {
      id: 'qtyT0',
      displayName: 'Кол-во Т0',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => Number(a.qtyT0) - Number(b.qtyT0),
      tooltip: 'Количество позиций с учётом сегодняшних расчётов',
      minWidth: 65
    },
    {
      id: 'qtyT1',
      displayName: 'Кол-во Т1',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => Number(a.qtyT1) - Number(b.qtyT1),
      tooltip: 'Количество позиций с учётом завтрашних расчётов',
      minWidth: 65
    },
    {
      id: 'qtyT2',
      displayName: 'Кол-во Т2',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => Number(a.qtyT2) - Number(b.qtyT2),
      tooltip: 'Количество позиций с учётом послезавтрашних расчётов',
      minWidth: 65
    },
    {
      id: 'qtyTFuture',
      displayName: 'Кол-во ТFuture',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => Number(a.qtyTFuture) - Number(b.qtyTFuture),
      tooltip: 'Количество позиций с учётом всех заявок',
      minWidth: 65
    },
    {
      id: 'volume',
      displayName: 'Ср. объём',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => a.volume - b.volume,
      tooltip: 'Объём по позиции, рассчитанный по средней цене',
      minWidth: 60
    },
    {
      id: 'currentVolume',
      displayName: 'Тек. объём',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => a.currentVolume - b.currentVolume,
      tooltip: 'Объём по позиции рассчитанный по текущей цене',
      minWidth: 60
    },
    {
      id: 'unrealisedPl',
      displayName: 'P/L всего',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => a.unrealisedPl - b.unrealisedPl,
      tooltip: 'Соотношение прибыли и убытка',
      minWidth: 60
    },
    {
      id: 'unrealisedPlRatio',
      displayName: 'P/L всего, %',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => a.unrealisedPlRatio - b.unrealisedPlRatio,
      tooltip: 'Соотношение прибыли и убытка в процентах',
      minWidth: 60
    },
    {
      id: 'dailyUnrealisedPl',
      displayName: 'P/L дн.',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => a.dailyUnrealisedPl - b.dailyUnrealisedPl,
      tooltip: 'Соотношение прибыли и убытка за сегодня',
      minWidth: 60
    },
    {
      id: 'dailyUnrealisedPlRatio',
      displayName: 'P/L дн., %',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => a.dailyUnrealisedPlRatio - b.dailyUnrealisedPlRatio,
      tooltip: 'Соотношение прибыли и убытка за сегодня в процентах',
      minWidth: 60
    },
  ];

  override settingsTableName = TableNames.PositionsTable;

  override settingsColumnsName = ColumnsNames.PositionsColumns;

  override fileSuffix = 'positions';

  readonly abs = Math.abs;

  protected readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  protected readonly userContext = inject(USER_CONTEXT);

  private readonly service = inject(BlotterService);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly marginOrderConfirmationService = inject(MarginOrderConfirmationService);

  get restoreFiltersAndSortOnLoad(): boolean {
    return true;
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.portfolioTotalCost$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => WidgetSettingsHelper.isEqualPortfolioDependedSettings(previous, current)),
      switchMap(s => {
        if (this.marketType() === MarketType.Forward) {
          return this.portfolioSubscriptionsService.getSpectraRisksSubscription(s.portfolio, s.exchange)
            .pipe(map(i => {
              return i.moneyAmount;
            }));
        } else {
          return this.portfolioSubscriptionsService.getSummariesSubscription(s.portfolio, s.exchange)
            .pipe(map(i => {
              return i.portfolioLiquidationValue;
            }));
        }
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  round(number: number): number {
    return MathHelper.round(number, 2);
  }

  override rowClick(row: PositionDisplay): void {
    this.settings$
      .pipe(
        take(1)
      )
      .subscribe(s => this.service.selectNewInstrument(
        row.targetInstrument.symbol,
        row.targetInstrument.exchange,
        null,
        s.badgeColor ?? DefaultBadge
      ));
  }

  closePosition(position: PositionDisplay, skipMarginCheck = false): void {
    if (skipMarginCheck) {
      CommonOrderCommands.closePositionByMarket(position, null, this.orderCommandService);
      return;
    }

    this.marginOrderConfirmationService.checkWithConfirmation({
      portfolio: position.ownedPortfolio.portfolio,
      exchange: position.ownedPortfolio.exchange
    }).pipe(
      take(1)
    ).subscribe(isConfirmed => {
      CommonOrderCommands.closePositionByMarket(position, null, this.orderCommandService, isConfirmed ?? undefined);
    });
  }

  reversePosition(position: PositionDisplay): void {
    this.marginOrderConfirmationService.checkWithConfirmation({
      portfolio: position.ownedPortfolio.portfolio,
      exchange: position.ownedPortfolio.exchange
    }).pipe(
      take(1)
    ).subscribe(isConfirmed => {
      CommonOrderCommands.reversePositionsByMarket(position, null, this.orderCommandService, isConfirmed ?? undefined);
    });
  }

  closeAllPositions(positions: readonly PositionDisplay[]): void {
    const positionsToClose = positions.filter(p => !!p.qtyTFutureBatch);

    if (positionsToClose.length > 0) {
      this.marginOrderConfirmationService.checkWithConfirmation({
        portfolio: positionsToClose[0].ownedPortfolio.portfolio,
        exchange: positionsToClose[0].ownedPortfolio.exchange
      }).pipe(
        take(1)
      ).subscribe(() => {
        positionsToClose.forEach(p => this.closePosition(p, true));
      });
    }
  }

  getClosablePositions(positions: readonly PositionDisplay[], user: User): PositionDisplay[] {
    return positions.filter(p => this.canClosePosition(p, user));
  }

  showPositionActions(settings: BlotterWidgetSettings, user: User): boolean {
    return (settings.showPositionActions ?? false)
      && (
        PermissionsHelper.hasPermission(user, Permission.ClosePosition)
        || PermissionsHelper.hasPermission(user, Permission.ReversePosition)
      );
  }

  canClosePosition(position: PositionDisplay, user: User): boolean {
    return PermissionsHelper.hasPermission(user, Permission.ClosePosition)
      && !position.isCurrency
      && this.abs(position.qtyTFutureBatch) > 0;
  }

  canReversePosition(position: PositionDisplay, user: User): boolean {
    return PermissionsHelper.hasPermission(user, Permission.ReversePosition)
      && !position.isCurrency
      && this.abs(position.qtyTFutureBatch) > 0;
  }

  protected initTableConfigStream(): Observable<TableConfig<PositionDisplay>> {
    const tableSettings$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.positionsTable, current.positionsTable)
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
      translator: this.translatorService.getTranslator('blotter/positions')
    }).pipe(
      mapWith(() => tableState$, (source, output) => ({...source, ...output})),
      takeUntilDestroyed(this.destroyRef),
      tap(x => {
        if (x.filters != null) {
          this.filterChange(x.filters);
        }
      }),
      map(x => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(x.tableSettings.positionsTable, x.tableSettings.positionsColumns);

        return {
          columns: this.allColumns
            .map(c => ({column: c, columnSettings: tableSettings?.columns.find(x => x.columnId === c.id)}))
            .filter(c => !!c.columnSettings)
            .map((column, index) => ({
              ...column.column,
              displayName: x.translator(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
              tooltip: x.translator(['columns', column.column.id, 'tooltip'], {fallback: column.column.tooltip}),
              width: column.columnSettings!.columnWidth ?? column.column.width ?? this.defaultColumnWidth,
              order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index),
              filterData: column.column.filterData
                ? {
                  ...column.column.filterData,
                  filterName: x.translator(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
                  filters: (column.column.filterData.filters ?? []).map(f => ({
                    value: x.filters?.[column.column.id] as unknown,
                    text: x.translator(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text}),
                    byDefault: this.isFilterItemApplied(column.column.id, x.filters, f)
                  })),
                  initialValue: x.filters?.[column.column.id]
                }
                : undefined,
              sortOrder: this.getSort(column.column.id, x.sort),
            }))
            .sort((a, b) => a.order - b.order)
        };
      })
    );
  }

  protected initTableDataStream(): Observable<PositionDisplay[]> {
    return this.settings$.pipe(
      distinctUntilChanged((previous, current) => WidgetSettingsHelper.isEqualPortfolioDependedSettings(previous, current)),
      switchMap(
        settings => this.service.getPositions(settings)
          .pipe(
            map((positions) => positions.map(p => ({
              ...p,
              id: `${p.targetInstrument.symbol}_${p.targetInstrument.exchange}`,
              dailyUnrealisedPlRatio: p.volume !== 0 ? (p.dailyUnrealisedPl * 100 / Math.abs(p.volume)) : 0,
              unrealisedPlRatio: p.volume !== 0 ? (p.unrealisedPl * 100 / Math.abs(p.volume)) : 0
            })))
          )
      ),
      debounceTime(100),
      startWith([]),
      mergeMap(positions => this.filters$.pipe(
        map(f => positions.filter(o => this.justifyFilter(o, f)))
      ))
    );
  }

  protected rowToInstrumentKey(row: PositionDisplay): Observable<InstrumentKey | null> {
    return this.service.getInstrumentToSelect(
      row.targetInstrument.symbol,
      row.targetInstrument.exchange,
      null
    );
  }
}
