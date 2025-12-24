import {Component, DestroyRef, inject, output} from '@angular/core';
import {combineLatest, defer, distinctUntilChanged, Observable, switchMap, take} from "rxjs";
import {BaseColumnSettings, FilterType} from "../../../../shared/models/settings/table-settings.model";
import {allRepoTradesColumns, TableNames} from "../../models/blotter-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {BlotterService} from "../../services/blotter.service";
import {TimezoneConverterService} from "../../../../shared/services/timezone-converter.service";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {debounceTime, map, mergeMap, startWith, tap} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {isEqualPortfolioDependedSettings} from "../../../../shared/utils/settings-helper";
import {RepoTrade} from "../../../../shared/models/trades/trade.model";
import {BlotterBaseTableComponent} from "../blotter-base-table/blotter-base-table.component";
import {TradeFilter} from "../../models/trade.model";
import {TableConfig} from "../../../../shared/models/table-config.model";
import {NzContextMenuService, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {ExportHelper} from "../../utils/export-helper";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {LetDirective} from '@ngrx/component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {NzTableModule} from 'ng-zorro-antd/table';
import {TableRowHeightDirective} from '../../../../shared/directives/table-row-height.directive';
import {CdkDrag, CdkDropList} from '@angular/cdk/drag-drop';
import {ResizeColumnDirective} from '../../../../shared/directives/resize-column.directive';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  TableSearchFilterComponent
} from '../../../../shared/components/table-search-filter/table-search-filter.component';
import {
  AddToWatchlistMenuComponent
} from '../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'ats-repo-trades',
  templateUrl: './repo-trades.component.html',
  styleUrls: ['./repo-trades.component.less'],
  imports: [
    TranslocoDirective,
    NzEmptyComponent,
    LetDirective,
    NzResizeObserverDirective,
    TableRowHeightDirective,
    CdkDropList,
    ResizeColumnDirective,
    CdkDrag,
    NzTooltipDirective,
    NzIconDirective,
    NzButtonComponent,
    NzDropdownMenuComponent,
    TableSearchFilterComponent,
    AddToWatchlistMenuComponent,
    DecimalPipe,
    NzTableModule
  ]
})
export class RepoTradesComponent extends BlotterBaseTableComponent<RepoTrade, TradeFilter> {
  readonly shouldShowSettingsChange = output<boolean>();
  allColumns: BaseColumnSettings<RepoTrade>[] = [
    {
      id: 'id',
      displayName: 'Id',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(a.id) - Number(b.id),
      filterData: {
        filterName: 'id',
        filterType: FilterType.Search
      },
      tooltip: 'Идентификационный номер сделки'
    },
    {
      id: 'orderNo',
      displayName: 'Заявка',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(a.orderNo) - Number(b.orderNo),
      filterData: {
        filterName: 'orderNo',
        filterType: FilterType.Search
      },
      tooltip: 'Номер заявки',
      minWidth: 80
    },
    {
      id: 'symbol',
      displayName: 'Тикер',
      sortOrder: null,
      transformFn: data => data.targetInstrument.symbol,
      sortFn: (a: RepoTrade, b: RepoTrade): number => a.targetInstrument.symbol.localeCompare(b.targetInstrument.symbol),
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
      sortFn: (a: RepoTrade, b: RepoTrade): number => a.side.toString().localeCompare(b.side.toString()),
      filterData: {
        filterName: 'side',
        filterType: FilterType.DefaultMultiple,
        filters: [
          {text: 'Покупка', value: 'buy'},
          {text: 'Продажа', value: 'sell'}
        ]
      },
      tooltip: 'Сторона сделки (покупка/продажа)',
      minWidth: 75
    },
    {
      id: 'qty',
      displayName: 'Кол-во',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(a.qty) - Number(b.qty),
      tooltip: 'Количество сделок',
      minWidth: 65
    },
    {
      id: 'price',
      displayName: 'Цена',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(a.price) - Number(b.price),
      tooltip: 'Цена'
    },
    {
      id: 'date',
      displayName: 'Время',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(a.date) - Number(b.date),
      tooltip: 'Время совершения сделки',
      minWidth: 60
    },
    {
      id: 'value',
      displayName: 'Объем',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(b.repoSpecificFields.value) - Number(a.repoSpecificFields.value),
      filterData: {
        filterName: 'repoSpecificFields.value',
        filterType: FilterType.Search
      },
      tooltip: 'Объём',
      minWidth: 60
    },
    {
      id: 'repoRate',
      displayName: '% годовых',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(b.repoSpecificFields.repoRate) - Number(a.repoSpecificFields.repoRate),
      filterData: {
        filterName: 'repoSpecificFields.repoRate',
        filterType: FilterType.Search
      },
      tooltip: '% годовых',
      minWidth: 60
    },
    {
      id: 'extRef',
      displayName: 'Пользователь внеш. системы',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => a.repoSpecificFields.extRef.toString().localeCompare(b.repoSpecificFields.extRef.toString()),
      filterData: {
        filterName: 'repoSpecificFields.extRef',
        filterType: FilterType.Search
      },
      tooltip: 'Пользователь внеш. системы',
      minWidth: 60
    },
    {
      id: 'repoTerm',
      displayName: 'Срок',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(b.repoSpecificFields.repoTerm) - Number(a.repoSpecificFields.repoTerm),
      filterData: {
        filterName: 'repoSpecificFields.repoTerm',
        filterType: FilterType.Search
      },
      tooltip: 'Срок РЕПО',
      minWidth: 50
    },
    {
      id: 'account',
      displayName: 'Торговый счёт',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => a.repoSpecificFields.account.toString().localeCompare(b.repoSpecificFields.account.toString()),
      filterData: {
        filterName: 'repoSpecificFields.account',
        filterType: FilterType.Search
      },
      tooltip: 'Торговый счёт',
      minWidth: 60
    },
    {
      id: 'tradeTypeInfo',
      displayName: 'Тип',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => a.repoSpecificFields.tradeTypeInfo.toString().localeCompare(b.repoSpecificFields.tradeTypeInfo.toString()),
      filterData: {
        filterName: 'repoSpecificFields.tradeTypeInfo',
        filterType: FilterType.Search
      },
      tooltip: 'Тип',
      minWidth: 60
    },
    {
      id: 'yield',
      displayName: 'Доход',
      sortOrder: null,
      sortFn: (a: RepoTrade, b: RepoTrade): number => Number(b.repoSpecificFields.yield) - Number(a.repoSpecificFields.yield),
      filterData: {
        filterName: 'repoSpecificFields.yield',
        filterType: FilterType.Search
      },
      tooltip: 'Доход',
      minWidth: 50
    },
  ];

  settingsTableName = TableNames.RepoTradesTable;
  fileSuffix = 'repoTrades';
  protected readonly settingsService: WidgetSettingsService;
  protected readonly service = inject(BlotterService);
  protected readonly translatorService: TranslatorService;
  protected readonly nzContextMenuService: NzContextMenuService;
  protected readonly widgetLocalStateService: WidgetLocalStateService;
  protected readonly destroyRef: DestroyRef;
  private readonly timezoneConverterService = inject(TimezoneConverterService);

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

  searchInItem(trade: RepoTrade, key: keyof RepoTrade | keyof RepoTrade['repoSpecificFields'], value?: string): boolean {
    if (value == null || !value.length) {
      return true;
    }

    return ((trade[key as keyof RepoTrade] as unknown) ?? trade.repoSpecificFields[<keyof RepoTrade['repoSpecificFields']>key])!.toString().toLowerCase().includes((value as string).toLowerCase());
  }

  protected initTableConfigStream(): Observable<TableConfig<RepoTrade>> {
    const tableSettings$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.repoTradesTable, current.repoTradesTable)
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
      tTrades: this.translatorService.getTranslator('blotter/trades'),
      tRepoTrades: this.translatorService.getTranslator('blotter/repo-trades')
    }).pipe(
      mapWith(() => tableState$, (source, output) => ({...source, ...output})),
      takeUntilDestroyed(this.destroyRef),
      tap(x => {
        if (x.filters != null) {
          this.filterChange(x.filters);
        }
      }),
      map(x => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(x.tableSettings.repoTradesTable, allRepoTradesColumns.filter(c => c.isDefault).map(c => c.id));

        return {
          columns: this.allColumns
            .map(c => ({column: c, columnSettings: tableSettings?.columns.find(x => x.columnId === c.id)}))
            .filter(c => !!c.columnSettings)
            .map((column, index) => ({
              ...column.column,
              displayName: x.tTrades(
                ['columns', column.column.id, 'name'],
                {
                  fallback: x.tRepoTrades(['columns', column.column.id, 'name'], {falback: column.column.displayName})
                }
              ),
              tooltip: x.tTrades(
                ['columns', column.column.id, 'tooltip'],
                {
                  fallback: x.tRepoTrades(['columns', column.column.id, 'tooltip'], {falback: column.column.tooltip})
                }
              ),
              filterData: column.column.filterData
                ? {
                  ...column.column.filterData,
                  filterName: x.tTrades(
                    ['columns', column.column.id, 'name'],
                    {
                      fallback: x.tRepoTrades(['columns', column.column.id, 'name'], {falback: column.column.displayName})
                    }
                  ),
                  filters: (column.column.filterData.filters ?? []).map(f => ({
                    value: f.value as unknown,
                    text: x.tTrades(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text}),
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

  protected initTableDataStream(): Observable<RepoTrade[]> {
    const trades$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getRepoTrades(settings)),
      debounceTime(100),
      startWith([])
    );

    return combineLatest([
        trades$,
        this.timezoneConverterService.getConverter()
      ]
    ).pipe(
      map(([trades, converter]) => trades.map((t: RepoTrade) => <RepoTrade>{
        ...t,
        date: converter.toTerminalDate(t.date)
      })),
      mergeMap(trades => this.filters$.pipe(
        map(f => trades.filter((t: RepoTrade) => this.justifyFilter(t, f)))
      ))
    );
  }

  protected rowToInstrumentKey(row: RepoTrade): Observable<InstrumentKey | null> {
    return this.service.getInstrumentToSelect(
      row.targetInstrument.symbol,
      row.targetInstrument.exchange,
      row.targetInstrument.instrumentGroup ?? null
    );
  }

  protected exportToFile(data?: RepoTrade[]): void {
    combineLatest({
      tBlotter: this.translatorService.getTranslator('blotter'),
      settings: this.settings$,
      tableConfig: this.tableConfig$
    })
      .pipe(
        take(1),
      )
      .subscribe(({tBlotter, settings, tableConfig}) => {
        const valueTranslators = new Map<string, (value: any) => string>([
          ['date', (value): string => this.formatDate(value)]
        ]);

        const exportedData = (data ?? []).map(trade => ({...trade, ...trade.repoSpecificFields}));

        ExportHelper.exportToCsv(
          tBlotter(['repoTradesTab']),
          settings,
          [...exportedData],
          tableConfig.columns,
          valueTranslators
        );
      });
  }
}
