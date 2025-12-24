import {Component, DestroyRef, inject, input, OnInit, output} from '@angular/core';
import {combineLatest, defer, distinctUntilChanged, Observable, shareReplay, switchMap, take, tap} from 'rxjs';
import {debounceTime, map, mergeMap, startWith} from 'rxjs/operators';
import {Position} from 'src/app/shared/models/positions/position.model';
import {MathHelper} from 'src/app/shared/utils/math-helper';
import {PositionFilter} from '../../models/position-filter.model';
import {BlotterService} from '../../services/blotter.service';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {isEqualPortfolioDependedSettings} from "../../../../shared/utils/settings-helper";
import {TableSettingHelper} from '../../../../shared/utils/table-setting.helper';
import {TranslatorService} from "../../../../shared/services/translator.service";
import {BlotterSettings, ColumnsNames, TableNames} from '../../models/blotter-settings.model';
import {BaseColumnSettings, FilterType} from "../../../../shared/models/settings/table-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {BlotterBaseTableComponent} from "../blotter-base-table/blotter-base-table.component";
import {CommonOrderCommands} from "../../../../shared/utils/common-order-commands";
import {MarketType} from "../../../../shared/models/portfolio-key.model";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {TableConfig} from "../../../../shared/models/table-config.model";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../../shared/services/orders/order-command.service";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {LetDirective} from '@ngrx/component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {NzTableModule} from 'ng-zorro-antd/table';
import {TableRowHeightDirective} from '../../../../shared/directives/table-row-height.directive';
import {CdkDrag, CdkDropList} from '@angular/cdk/drag-drop';
import {NzPopconfirmDirective} from 'ng-zorro-antd/popconfirm';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {ResizeColumnDirective} from '../../../../shared/directives/resize-column.directive';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {InstrumentIconComponent} from '../../../../shared/components/instrument-icon/instrument-icon.component';
import {
  InstrumentBadgeDisplayComponent
} from '../../../../shared/components/instrument-badge-display/instrument-badge-display.component';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  TableSearchFilterComponent
} from '../../../../shared/components/table-search-filter/table-search-filter.component';
import {
  AddToWatchlistMenuComponent
} from '../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component';
import {DecimalPipe} from '@angular/common';

interface PositionDisplay extends Position {
  id: string;
  volume: number;
  dailyUnrealisedPlRatio: number;
  unrealisedPlRatio: number;
}

@Component({
  selector: 'ats-positions',
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.less'],
  imports: [
    TranslocoDirective,
    NzEmptyComponent,
    LetDirective,
    NzResizeObserverDirective,
    TableRowHeightDirective,
    CdkDropList,
    NzPopconfirmDirective,
    NzIconDirective,
    ResizeColumnDirective,
    CdkDrag,
    NzTooltipDirective,
    InstrumentIconComponent,
    InstrumentBadgeDisplayComponent,
    NzButtonComponent,
    NzDropdownMenuComponent,
    TableSearchFilterComponent,
    AddToWatchlistMenuComponent,
    DecimalPipe,
    NzTableModule
  ]
})
export class PositionsComponent extends BlotterBaseTableComponent<PositionDisplay, PositionFilter> implements OnInit {
  readonly marketType = input<MarketType | null>();
  portfolioTotalCost$!: Observable<number>;
  readonly shouldShowSettingsChange = output<boolean>();
  allColumns: BaseColumnSettings<PositionDisplay>[] = [
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

  settingsTableName = TableNames.PositionsTable;
  settingsColumnsName = ColumnsNames.PositionsColumns;
  fileSuffix = 'positions';
  readonly abs = Math.abs;
  protected readonly settingsService: WidgetSettingsService;
  protected readonly translatorService: TranslatorService;
  protected readonly orderCommandService = inject<OrderCommandService>(ORDER_COMMAND_SERVICE_TOKEN);
  protected readonly nzContextMenuService: NzContextMenuService;
  protected readonly widgetLocalStateService: WidgetLocalStateService;
  protected readonly destroyRef: DestroyRef;
  private readonly service = inject(BlotterService);
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  constructor() {
    const settingsService = inject(WidgetSettingsService);
    const translatorService = inject(TranslatorService);
    const nzContextMenuService = inject(NzContextMenuService);
    const widgetLocalStateService = inject(WidgetLocalStateService);
    const destroyRef = inject(DestroyRef);

    super(
      settingsService,
      translatorService,
      nzContextMenuService,
      widgetLocalStateService,
      destroyRef
    );

    this.settingsService = settingsService;
    this.translatorService = translatorService;
    this.nzContextMenuService = nzContextMenuService;
    this.widgetLocalStateService = widgetLocalStateService;
    this.destroyRef = destroyRef;
  }

  get restoreFiltersAndSortOnLoad(): boolean {
    return true;
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.portfolioTotalCost$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
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

  rowClick(row: PositionDisplay): void {
    this.settings$
      .pipe(
        take(1)
      )
      .subscribe(s => this.service.selectNewInstrument(
        row.targetInstrument.symbol,
        row.targetInstrument.exchange,
        null,
        s.badgeColor ?? defaultBadgeColor
      ));
  }

  closePosition(position: PositionDisplay): void {
    CommonOrderCommands.closePositionByMarket(position, null, this.orderCommandService);
  }

  reversePosition(position: PositionDisplay): void {
    CommonOrderCommands.reversePositionsByMarket(position, null, this.orderCommandService);
  }

  closeAllPositions(positions: readonly PositionDisplay[]): void {
    positions
      .filter(p => !!p.qtyTFutureBatch)
      .forEach(p => {
        this.closePosition(p);
      });
  }

  getClosablePositions(positions: readonly PositionDisplay[]): PositionDisplay[] {
    return positions.filter(p => this.canClosePosition(p));
  }

  showPositionActions(settings: BlotterSettings): boolean {
    return settings.showPositionActions ?? false;
  }

  canClosePosition(position: PositionDisplay): boolean {
    return !position.isCurrency && this.abs(position.qtyTFutureBatch) > 0;
  }

  canReversePosition(position: PositionDisplay): boolean {
    return this.canClosePosition(position);
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
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(
        settings => this.service.getPositions(settings)
          .pipe(
            map((positions) => positions.map(p => ({
              ...p,
              id: `${p.targetInstrument.symbol}_${p.targetInstrument.exchange}`,
              dailyUnrealisedPlRatio: p.dailyUnrealisedPl * 100 / Math.abs(p.volume),
              unrealisedPlRatio: p.unrealisedPl * 100 / Math.abs(p.volume)
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
