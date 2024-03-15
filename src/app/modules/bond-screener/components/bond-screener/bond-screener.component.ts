import { Component, DestroyRef, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, shareReplay, switchMap, take, tap } from 'rxjs';
import { TableConfig } from '../../../../shared/models/table-config.model';
import { BaseColumnSettings } from '../../../../shared/models/settings/table-settings.model';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { BondScreenerSettings } from '../../models/bond-screener-settings.model';
import { filter, map } from 'rxjs/operators';
import { BondScreenerService } from "../../services/bond-screener.service";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { BondNode } from "../../models/bond-screener.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { ACTIONS_CONTEXT, ActionsContext } from "../../../../shared/services/actions-context";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { InstrumentGroups } from "../../../../shared/models/dashboard/dashboard.model";
import { MathHelper } from "../../../../shared/utils/math-helper";
import { BOND_FILTER_TYPES, BOND_NESTED_FIELDS } from "../../utils/bond-screener.helper";
import {
  LazyLoadingBaseTableComponent
} from "../../../../shared/components/lazy-loading-base-table/lazy-loading-base-table.component";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import {
  GraphQlCondition,
  GraphQlEdge,
  GraphQlFilter,
  GraphQlFilters,
  GraphQlPageInfo,
  GraphQlSort,
  GraphQlSortType
} from "../../../../shared/models/graph-ql.model";

interface BondDisplay extends BondNode {
  id: string;
}

@Component({
  selector: 'ats-bond-screener',
  templateUrl: './bond-screener.component.html',
  styleUrls: ['./bond-screener.component.less']
})
export class BondScreenerComponent extends LazyLoadingBaseTableComponent<
  BondDisplay,
  { [propName: string]: any },
  GraphQlPageInfo,
  GraphQlSort
> implements OnInit, OnDestroy {

  @Input({required: true}) guid!: string;

  bondsList$ = new BehaviorSubject<BondDisplay[]>([]);
  settings$!:Observable<BondScreenerSettings>;
  allColumns: BaseColumnSettings<BondDisplay>[] = [
    {
      id: 'tradingStatusInfo',
      displayName: 'Статус',
      transformFn: (d: BondNode): string => d.financialAttributes!.tradingStatusInfo ?? '',
      sortChangeFn: (dir): void => this.sortChange(['financialAttributes', 'tradingStatusInfo'], dir),
      width: 90
    },
    {
      id: 'symbol',
      displayName: 'Тикер',
      transformFn: (d: BondNode): string => d.basicInformation.symbol,
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'symbol'], dir),
      width: 120,
      filterData: {
        filterName: 'symbol'
      },
      showBadges: true
    },
    {
      id: 'shortName',
      displayName: 'Назв.',
      transformFn: (d: BondNode): string => d.basicInformation.shortName ?? '',
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'shortName'], dir),
      width: 100,
      filterData: {
        filterName: 'shortName'
      }
    },
    {
      id: 'exchange',
      displayName: 'Биржа',
      transformFn: (d: BondNode): string => d.basicInformation.exchange,
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'exchange'], dir),
      width: 90,
      filterData: {
        filterName: 'exchange',
        isDefaultFilter: true,
        filters: [
          { value: 'MOEX', text: 'MOEX' },
          { value: 'SPBX', text: 'SPBX' }
        ],
        isMultipleFilter: true
      }
    },
    {
      id: 'maturityDate',
      displayName: 'Дата погашения',
      transformFn: (d: BondNode): string => d.maturityDate == null ? '' : new Date(d.maturityDate).toLocaleDateString(),
      sortChangeFn: (dir): void => this.sortChange(['maturityDate'], dir),
      width: 110,
      filterData: {
        filterName: 'maturityDate',
        isInterval: true,
        intervalStartName: 'maturityDateFrom',
        intervalEndName: 'maturityDateTo'
      }
    },
    {
      id: 'placementEndDate',
      displayName: 'Дата окончания размещения',
      transformFn: (d: BondNode): string => d.placementEndDate == null ? '' : new Date(d.placementEndDate).toLocaleDateString(),
      sortChangeFn: (dir): void => this.sortChange(['placementEndDate'], dir),
      width: 120,
      filterData: {
        filterName: 'placementEndDate',
        isInterval: true,
        intervalStartName: 'placementEndDateFrom',
        intervalEndName: 'placementEndDateTo'
      }
    },
    {
      id: 'cancellation',
      displayName: 'Дата окончания',
      transformFn: (d: BondNode): string => d.additionalInformation!.cancellation == null ? '' : new Date(d.additionalInformation!.cancellation).toLocaleDateString(),
      sortChangeFn: (dir): void => this.sortChange(['additionalInformation', 'cancellation'], dir),
      width: 110,
      filterData: {
        filterName: 'cancellation',
        isInterval: true,
        intervalStartName: 'cancellationFrom',
        intervalEndName: 'cancellationTo'
      }
    },
    {
      id: 'currentYield',
      displayName: 'Доходность, %',
      transformFn: (d: BondNode): string => d.yield!.currentYield != null ? MathHelper.round(d.yield!.currentYield * 100, 2).toString() : '',
      sortChangeFn: (dir): void => this.sortChange(['yield', 'currentYield'], dir),
      width: 120,
      filterData: {
        filterName: 'currentYield',
        isInterval: true,
        intervalStartName: 'currentYieldFrom',
        intervalEndName: 'currentYieldTo'
      }
    },
    {
      id: 'issueValue',
      displayName: 'Заявл. объём выпуска',
      transformFn: (d: BondNode): string => d.volumes!.issueValue != null ? MathHelper.round(+d.volumes!.issueValue!, 2).toString() : '',
      sortChangeFn: (dir): void => this.sortChange(['volumes', 'issueValue'], dir),
      width: 100,
      filterData: {
        filterName: 'issueValue',
        isInterval: true,
        intervalStartName: 'issueValueFrom',
        intervalEndName: 'issueValueTo'
      }
    },
    {
      id: 'couponType',
      displayName: 'Тип купона',
      sortChangeFn: (dir): void => this.sortChange(['couponType'], dir),
      width: 110,
      filterData: {
        filterName: 'couponType',
        isDefaultFilter: true,
        filters: [
          { value: 'FIXED', text: 'FIXED'},
          { value: 'FLOAT', text: 'FLOAT'},
          { value: 'UNKNOWN', text: 'UNKNOWN'}
        ],
        isMultipleFilter: true
      }
    },
    {
      id: 'couponRate',
      displayName: 'Ставка купона',
      sortChangeFn: (dir): void => this.sortChange(['couponRate'], dir),
      width: 90,
      filterData: {
        filterName: 'couponRate',
        isInterval: true,
        intervalStartName: 'couponRateFrom',
        intervalEndName: 'couponRateTo'
      }
    },
    {
      id: 'priceMultiplier',
      displayName: 'Множитель цены',
      transformFn: (d: BondNode): string => d.additionalInformation!.priceMultiplier?.toString() ?? '',
      sortChangeFn: (dir): void => this.sortChange(['additionalInformation', 'priceMultiplier'], dir),
      width: 110,
      filterData: {
        filterName: 'priceMultiplier',
        isInterval: true,
        intervalStartName: 'priceMultiplierFrom',
        intervalEndName: 'priceMultiplierTo'
      }
    },
    {
      id: 'board',
      displayName: 'Режим торогов',
      transformFn: (d: BondNode): string => d.boardInformation!.board ?? '',
      sortChangeFn: (dir): void => this.sortChange(['boardInformation', 'board'], dir),
      width: 90,
      filterData: {
        filterName: 'board'
      }
    },
    {
      id: 'guaranteed',
      displayName: 'Гарантия',
      sortChangeFn: (dir): void => this.sortChange(['guaranteed'], dir),
      width: 100,
      filterData: {
        filterName: 'guaranteed',
        isDefaultFilter: true,
        filters: [
          { value: true, text: 'Да'},
          { value: false, text: 'Нет'}
        ]
      }
    },
    {
      id: 'hasOffer',
      displayName: 'Доср. выкуп/погашение',
      sortChangeFn: (dir): void => this.sortChange(['hasOffer'], dir),
      width: 110,
      filterData: {
        filterName: 'hasOffer',
        isDefaultFilter: true,
        filters: [
          { value: true, text: 'Да'},
          { value: false, text: 'Нет'}
        ]
      }
    },
    {
      id: 'lotSize',
      displayName: 'Размер лота',
      transformFn: (d: BondNode): string => d.tradingDetails!.lotSize?.toString() ?? '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'lotSize'], dir),
      width: 90,
      filterData: {
        filterName: 'lotSize',
        isInterval: true,
        intervalStartName: 'lotSizeFrom',
        intervalEndName: 'lotSizeTo'
      }
    },
    {
      id: 'minStep',
      displayName: 'Шаг цены',
      transformFn: (d: BondNode): string => d.tradingDetails!.minStep?.toString() ?? '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'minStep'], dir),
      width: 80,
      filterData: {
        filterName: 'minStep',
        isInterval: true,
        intervalStartName: 'minStepFrom',
        intervalEndName: 'minStepTo'
      }
    },
    {
      id: 'priceMax',
      displayName: 'Макс. цена',
      transformFn: (d: BondNode): string => d.tradingDetails!.priceMax?.toString() ?? '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceMax'], dir),
      width: 80,
      filterData: {
        filterName: 'priceMax',
        isInterval: true,
        intervalStartName: 'priceMaxFrom',
        intervalEndName: 'priceMaxTo'
      }
    },
    {
      id: 'priceMin',
      displayName: 'Мин. цена',
      transformFn: (d: BondNode): string => d.tradingDetails!.priceMin?.toString() ?? '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceMin'], dir),
      width: 80,
      filterData: {
        filterName: 'priceMin',
        isInterval: true,
        intervalStartName: 'priceMinFrom',
        intervalEndName: 'priceMinTo'
      }
    },
    {
      id: 'priceStep',
      displayName: 'Стоимость шага цены',
      transformFn: (d: BondNode): string => d.tradingDetails!.priceStep?.toString() ?? '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceStep'], dir),
      width: 110,
      filterData: {
        filterName: 'priceStep',
        isInterval: true,
        intervalStartName: 'priceStepFrom',
        intervalEndName: 'priceStepTo'
      }
    }
  ];

  settingsTableName = 'bondScreenerTable';

  private readonly defaultFilter = {
    boardInformation: {
      isPrimaryBoard: {
        eq: true
      }
    }
  };

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    private readonly service: BondScreenerService,
    private readonly translatorService: TranslatorService,
    @Inject(ACTIONS_CONTEXT) private readonly actionsContext: ActionsContext,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(settingsService, destroyRef);
  }

  ngOnInit(): void {
    this.filters$.next({ and: [this.defaultFilter ]});
    this.settings$ = this.settingsService.getSettings<BondScreenerSettings>(this.guid)
      .pipe(shareReplay(1));

    super.ngOnInit();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.bondsList$.complete();
  }

  applyFilter(filters: { [filterName: string]: string | string[] | null | number | boolean }): void {
    // Parse applied filters to graphQL filters
    const parsedFilters = Object.keys(filters)
      .filter(key =>
        filters[key] != null &&
        (
          (typeof filters[key] === 'number') ||
          (typeof filters[key] === 'boolean') ||
          (filters[key] as string | string[]).length > 0
        )
      )
      .reduce((acc, key) => {
        const parentField = Object.keys(BOND_NESTED_FIELDS)
          .find(k =>
            key.endsWith('From')
              ? BOND_NESTED_FIELDS[k].includes(key.replace('From', ''))
              : key.endsWith('To')
                ? BOND_NESTED_FIELDS[k].includes(key.replace('To', ''))
                : BOND_NESTED_FIELDS[k].includes(key)
          );

        if (parentField == null) {
          return acc;
        }

        const filterValue = this.getFilterValue(key, filters[key]!);

        if (filterValue == null) {
          return acc;
        }

        if (parentField === 'rootFields') {
          acc.push(filterValue);
        } else {
          acc.push({
            [parentField]: filterValue
          });
        }

        return acc;
      }, [] as (GraphQlFilter | GraphQlFilters)[]);

    this.pagination = null;
    this.filters$.next({
      and: [
        this.defaultFilter,
        ...parsedFilters
      ]
    });
  }

  rowClick(row: BondDisplay): void {
    const instrument = {
      symbol: row.basicInformation.symbol,
      exchange: row.basicInformation.exchange,
    };

    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext.instrumentSelected(instrument, s.badgeColor ?? defaultBadgeColor);
    });
  }

  scrolled(): void {
    this.scrolled$.next(null);
  }

  changeColumnOrder(event: CdkDragDrop<any>): void {
    super.changeColumnOrder<BondScreenerSettings>(event, this.settings$);
  }

  saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<BondScreenerSettings>(event, this.settings$);
  }

  private getFilterValue(filterName: string, filterValue: string | string[] | boolean | number): GraphQlFilter | GraphQlFilters | null {
    const filterType = Object.keys(BOND_FILTER_TYPES).find(key => BOND_FILTER_TYPES[key].includes(filterName));

    if (filterType === 'multiSelect') {
      return {
        or: (filterValue as string[]).map(value => ({ [filterName]: { eq: value } }))
      };
    }

    if (filterType === 'interval') {
      if (filterName.includes('From')) {
        return { [filterName.replace('From', '')]: { gte: Number(filterValue) } };
      }
      return { [filterName.replace('To', '')]: { lte: Number(filterValue) } };
    }

    if (filterType === 'bool') {
      return { [filterName]: { eq: filterValue }};
    }

    if (filterType === 'date') {
      const [day, month, year] = (filterValue as string).split('.').map(d => +d);
      const filterDate = new Date(year, month - 1, day);

      if (isNaN(filterDate.getTime())) {
        return null;
      }

      const parsedDate = filterDate.toISOString();

      if (filterName.includes('From')) {
        return { [filterName.replace('From', '')]: { gte: parsedDate } };
      }
      return { [filterName.replace('To', '')]: { lte: parsedDate } };
    }

    return { [filterName]: { contains: filterValue }};
  }

  protected initTableConfigStream(): Observable<TableConfig<BondDisplay>> {
    return this.settings$.pipe(
      mapWith(
        () => this.translatorService.getTranslator('bond-screener/bond-screener'),
        (settings, translate) => ({ settings, translate })
      ),
      map(({ settings, translate }) => {
        return {
          columns: this.allColumns
            .map(column => ({column, settings: settings.bondScreenerTable.columns.find(c => c.columnId === column.id)}))
            .filter(col => col.settings != null)
            .map((col, index) => ({
              ...col.column,
              displayName: translate(
                ['columns', col.column.id],
                { fallback: col.column.displayName }
              ),
              transformFn: ['couponType', 'hasOffer', 'guaranteed'].includes(col.column.id)
                ? (data: BondDisplay): string => translate(
                  ['filters', col.column.id, data[col.column.id as keyof BondDisplay]?.toString() ?? ''],
                  {fallback: data[col.column.id as keyof BondDisplay] as string}
                )
                : col.column.transformFn,
              filterData: col.column.filterData && {
                ...col.column.filterData,
                filters: col.column.filterData.filters?.map(f => ({
                  text: translate(
                    [ 'filters', col.column.id, f.value ],
                    { fallback: f.text }
                  ),
                  value: f.value as string
                }))
              },
              width: col.settings!.columnWidth ?? this.defaultColumnWidth,
              order: col.settings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
            }))
            .sort((a, b) => a.order - b.order)
        };
      })
    );
  }

  protected initTableDataStream(): Observable<BondDisplay[]> {
    combineLatest([
      this.tableConfig$,
      this.settings$,
      this.filters$,
      this.sort$.pipe(tap(() => this.pagination = null)),
      this.scrolled$
    ])
      .pipe(
        filter(() => this.pagination == null || this.pagination.hasNextPage),
        switchMap(([ tableConfig, settings, filters, sort ]) => {
          this.isLoading$.next(true);

          const columnIds = tableConfig.columns.map(c => c.id);

          const filtersWithDefaultValues = JSON.parse(JSON.stringify(filters)) as GraphQlFilters;
          const cancellationFromFilterValue = filtersWithDefaultValues.and?.find(f => (
            (
              (
                f as GraphQlFilter
              ).additionalInformation as GraphQlFilter
            )?.cancellation as GraphQlCondition
          )?.gte != null);

          if ((settings.hideExpired ?? true) && cancellationFromFilterValue == null) {
            filtersWithDefaultValues.and?.push({
              additionalInformation: {
                cancellation: {
                  gte: new Date().toISOString()
                }
              }
            });
          }

          return this.service.getBonds(
            columnIds,
            {
              first: this.loadingChunkSize,
              after: this.pagination?.endCursor,
              filters: filtersWithDefaultValues,
              sort: sort
            });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        if (data == null) {
          return;
        }

        const newBonds = data!.bonds.edges.map((be: GraphQlEdge<BondNode>) => ({
          ...be.node,
          id: be.cursor
        } as BondDisplay)) ?? [];

        this.isLoading$.next(false);
        if (this.pagination == null) {
          this.bondsList$.next(newBonds);
          this.pagination = data?.bonds.pageInfo ?? null;
          return;
        }

        this.bondsList$
          .pipe(take(1))
          .subscribe(bonds => {
            this.bondsList$.next([...bonds, ...newBonds]);
            this.pagination = data?.bonds.pageInfo ?? null;
          });
      });

    return this.bondsList$.asObservable()
      .pipe(
        mapWith(
          () => this.dashboardContextService.instrumentsSelection$,
          (bonds, badges) => ({ bonds, badges })
        ),
        mapWith(
          () => this.terminalSettingsService.getSettings(),
          (data, terminalSettings) => ({ ...data, terminalSettings })
        ),
        map(({ bonds, badges, terminalSettings }) => {
          const defaultBadges: InstrumentGroups = badges[defaultBadgeColor] != null
            ? {[defaultBadgeColor]: badges[defaultBadgeColor]}
            : {};
          const availableBadges = (terminalSettings.badgesBind ?? false) ? badges : defaultBadges;

          return bonds.map(b => ({
            ...b,
            badges: Object.keys(availableBadges)
              .filter(key =>
                b.basicInformation.symbol === availableBadges[key]!.symbol &&
                b.basicInformation.exchange === availableBadges[key]!.exchange
              )
          }));
        })
      );
  }

  private sortChange(fields: string[], sort: string | null): void {
    if (sort == null) {
      this.sort$.next(null);
      return;
    }

    const sortObj = fields.reduceRight((acc, curr, index) => {
      if (index === fields.length - 1) {
        return { [curr]: sort === 'descend' ? GraphQlSortType.DESC : GraphQlSortType.ASC };
      }
      return { [curr]: acc };
    }, {} as GraphQlSort);

    this.sort$.next(sortObj);
  }
}
