import {
  Component,
  DestroyRef,
  EventEmitter,
  Output
} from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  Observable,
  switchMap
} from "rxjs";
import { BaseColumnSettings, FilterType } from "../../../../shared/models/settings/table-settings.model";
import { allRepoTradesColumns, TableNames } from "../../models/blotter-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterService } from "../../services/blotter.service";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { debounceTime, map, mergeMap, startWith } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { isEqualPortfolioDependedSettings } from "../../../../shared/utils/settings-helper";
import { RepoTrade } from "../../../../shared/models/trades/trade.model";
import { BlotterBaseTableComponent } from "../blotter-base-table/blotter-base-table.component";
import { TradeFilter } from "../../models/trade.model";
import { TableConfig } from "../../../../shared/models/table-config.model";

@Component({
  selector: 'ats-repo-trades',
  templateUrl: './repo-trades.component.html',
  styleUrls: ['./repo-trades.component.less']
})
export class RepoTradesComponent extends BlotterBaseTableComponent<RepoTrade, TradeFilter> {
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
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
      sortFn: (a: RepoTrade, b: RepoTrade): number => a.symbol.localeCompare(b.symbol),
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
          { text: 'Покупка', value: 'buy' },
          { text: 'Продажа', value: 'sell' }
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

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly service: BlotterService,
    private readonly timezoneConverterService: TimezoneConverterService,
    protected readonly translatorService: TranslatorService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(settingsService, translatorService, destroyRef);
  }

  protected initTableConfigStream(): Observable<TableConfig<RepoTrade>> {
    return this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.repoTradesTable, current.repoTradesTable)
        && previous.badgeColor === current.badgeColor
      ),
      mapWith(
        () => this.translatorService.getTranslator('blotter/trades'),
        (s, tTrades) => ({ s, tTrades })
      ),
      mapWith(
        () => this.translatorService.getTranslator('blotter/repo-trades'),
        ({ s, tTrades }, tRepoTrades) => ({ s, tTrades, tRepoTrades })
      ),
      takeUntilDestroyed(this.destroyRef),
      map(({ s, tTrades, tRepoTrades }) => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(s.repoTradesTable, allRepoTradesColumns.filter(c => c.isDefault).map(c => c.id));

          return {
            columns: this.allColumns
              .map(c => ({column: c, columnSettings: tableSettings?.columns.find(x => x.columnId === c.id)}))
              .filter(c => !!c.columnSettings)
              .map((column, index) => ({
                ...column.column,
                displayName: tTrades(
                  ['columns', column.column.id, 'name'],
                  {
                    fallback: tRepoTrades(['columns', column.column.id, 'name'], {falback: column.column.displayName})
                  }
                ),
                tooltip: tTrades(
                  ['columns', column.column.id, 'tooltip'],
                  {
                    fallback: tRepoTrades(['columns', column.column.id, 'tooltip'], {falback: column.column.tooltip})
                  }
                ),
                filterData: column.column.filterData
                  ? {
                    ...column.column.filterData,
                    filterName: tTrades(
                      ['columns', column.column.id, 'name'],
                      {
                        fallback: tRepoTrades(['columns', column.column.id, 'name'], {falback: column.column.displayName})
                      }
                    ),
                    filters: (column.column.filterData.filters ?? []).map(f => ({
                      value: f.value as unknown,
                      text: tTrades(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text})
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

  searchInItem(trade: RepoTrade, key: keyof RepoTrade | keyof RepoTrade['repoSpecificFields'], value?: string): boolean {
    if (value == null || !value.length) {
      return true;
    }

    return ((trade[key as keyof RepoTrade] as unknown) ?? trade.repoSpecificFields[<keyof RepoTrade['repoSpecificFields']>key])!.toString().toLowerCase().includes((value as string).toLowerCase());
  }
}
