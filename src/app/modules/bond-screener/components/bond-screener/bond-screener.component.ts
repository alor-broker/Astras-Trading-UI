import { Component, DestroyRef, LOCALE_ID, OnDestroy, OnInit, input, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, shareReplay, switchMap, take, tap } from 'rxjs';
import { TableConfig } from '../../../../shared/models/table-config.model';
import {
  BaseColumnSettings,
  DefaultTableFilters,
  FilterType,
  InputFieldType
} from '../../../../shared/models/settings/table-settings.model';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { BondScreenerSettings } from '../../models/bond-screener-settings.model';
import { filter, map } from 'rxjs/operators';
import { BondScreenerService } from "../../services/bond-screener.service";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { ACTIONS_CONTEXT, ActionsContext } from "../../../../shared/services/actions-context";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { InstrumentGroups } from "../../../../shared/models/dashboard/dashboard.model";
import { MathHelper } from "../../../../shared/utils/math-helper";
import {
  LazyLoadingBaseTableComponent
} from "../../../../shared/components/lazy-loading-base-table/lazy-loading-base-table.component";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import {
  BasicInformation,
  Bond,
  BondsConnection,
  BondsEdge,
  BondSortInput,
  Coupon,
  Offer,
  PageInfo,
  SortEnumType
} from "../../../../../generated/graphql.types";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";
import { AddToWatchlistMenuComponent } from "../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component";
import { TableDataRow, InfiniteScrollTableComponent } from "../../../../shared/components/infinite-scroll-table/infinite-scroll-table.component";
import { formatNumber, AsyncPipe } from "@angular/common";
import { NzResizeObserverDirective } from 'ng-zorro-antd/cdk/resize-observer';

interface BondDisplay extends Omit<Bond, 'coupons' | 'offers' | 'amortizations'> {
  id: string;
  closestCoupon?: Coupon;
  closestOffer?: Offer;
}

@Component({
    selector: 'ats-bond-screener',
    templateUrl: './bond-screener.component.html',
    styleUrls: ['./bond-screener.component.less'],
    imports: [
      NzResizeObserverDirective,
      InfiniteScrollTableComponent,
      AddToWatchlistMenuComponent,
      AsyncPipe
    ]
})
export class BondScreenerComponent extends LazyLoadingBaseTableComponent<
  BondDisplay,
  DefaultTableFilters,
  PageInfo,
  BondSortInput
> implements OnInit, OnDestroy {
  protected readonly settingsService: WidgetSettingsService;
  private readonly service = inject(BondScreenerService);
  private readonly translatorService = inject(TranslatorService);
  private readonly actionsContext = inject<ActionsContext>(ACTIONS_CONTEXT);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly nzContextMenuService = inject(NzContextMenuService);
  protected readonly destroyRef: DestroyRef;
  private readonly locale = inject(LOCALE_ID);

  readonly guid = input.required<string>();

  bondsList$ = new BehaviorSubject<BondDisplay[]>([]);
  settings$!: Observable<BondScreenerSettings>;
  allColumns: BaseColumnSettings<BondDisplay>[] = [
    {
      id: 'tradingStatusInfo',
      displayName: 'Статус',
      transformFn: (d: BondDisplay): string => d.financialAttributes!.tradingStatusInfo ?? '',
      sortChangeFn: (dir): void => this.sortChange(['financialAttributes', 'tradingStatusInfo'], dir),
      width: 90
    },
    {
      id: 'symbol',
      displayName: 'Тикер',
      transformFn: (d: BondDisplay): string => d.basicInformation!.symbol,
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'symbol'], dir),
      width: 120,
      filterData: {
        filterName: 'symbol',
        filterType: FilterType.Search
      },
      showBadges: true
    },
    {
      id: 'shortName',
      displayName: 'Назв.',
      transformFn: (d: BondDisplay): string => d.basicInformation!.shortName ?? '',
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'shortName'], dir),
      width: 100,
      filterData: {
        filterName: 'shortName',
        filterType: FilterType.Search,
      }
    },
    {
      id: 'exchange',
      displayName: 'Биржа',
      transformFn: (d: BondDisplay): string => d.basicInformation!.exchange,
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'exchange'], dir),
      width: 90,
      filterData: {
        filterName: 'exchange',
        filterType: FilterType.DefaultMultiple,
        filters: [
          { value: 'MOEX', text: 'MOEX' },
          { value: 'SPBX', text: 'SPBX' }
        ]
      }
    },
    {
      id: 'complexProductCategory',
      displayName: 'Категория для торговли',
      transformFn: (d: BondDisplay): string => d.basicInformation.complexProductCategory,
      sortChangeFn: (dir): void => this.sortChange(['basicInformation', 'complexProductCategory'], dir),
      width: 110,
      filterData: {
        filterName: 'complexProductCategory',
        filterType: FilterType.DefaultMultiple,
        filters: [
          { value: '', text: 'Нет ограничений' },
          { value: '0', text: 'Инструменты, предназначенные для КИ' },
          { value: '1', text: 'Необеспеченные сделки' },
          { value: '2', text: 'Производные финансовые инструменты' },
          { value: '3', text: 'Договоры репо, требующие тестирования' },
          { value: '4', text: 'Структурные облигации, не предназначенные для КИ' },
          { value: '5', text: 'ЗПИФ, не предназначенные для КИ' },
          { value: '6', text: 'Облигации российских эмитентов без рейтинга' },
          { value: '7', text: 'Облигации иностранных эмитентов, исполнение по которым обеспечивается за счет юридического лица РФ без рейтинга' },
          { value: '8', text: 'Облигации со структурным доходом' },
          { value: '9', text: 'Акции, не включенные в котировальные списки' },
          { value: '10', text: 'Иностранные акции, требующие проведения тестирования' },
          { value: '11', text: 'Паи/акции ETF, не включенные в котировальные списки и допущенные к организованным торгам при наличии договора организатора торговли с \'ответственным\' лицом' },
          { value: '12', text: 'Паи/акции ETF, не включенные в котировальные списки и допущенные к организованным торгам при отсутствии договора организатора торговли с \'ответственным\' лицом' },
          { value: '13', text: 'Облигации российских или иностранных эмитентов, конвертируемых в иные ценные бумаги' },
          { value: '14', text: 'Облигации российских эмитентов с \'юрисдикцией\' выпуска вне рамок разрешенных' },
          { value: '15', text: 'Облигации иностранных эмитентов с \'юрисдикцией\' эмитента вне рамок разрешенных' },
          { value: '16', text: 'Резерв' },
          { value: '17', text: 'Все бумаги, не попадающие под тесты из Базового стандарта. Ценные бумаги без листинга на Санкт-Петербургской бирже, возникшие в результате корпоративных событий' },
        ]
      }
    },
    {
      id: 'maturityDate',
      displayName: 'Дата погашения',
      transformFn: (d: BondDisplay): string => d.maturityDate == null ? '' : new Date(d.maturityDate).toLocaleDateString(),
      sortChangeFn: (dir): void => this.sortChange(['maturityDate'], dir),
      width: 110,
      filterData: {
        filterName: 'maturityDate',
        filterType: FilterType.Interval,
        intervalStartName: 'maturityDateFrom',
        intervalEndName: 'maturityDateTo'
      }
    },
    {
      id: 'placementEndDate',
      displayName: 'Дата окончания размещения',
      transformFn: (d: BondDisplay): string => d.placementEndDate == null ? '' : new Date(d.placementEndDate).toLocaleDateString(),
      sortChangeFn: (dir): void => this.sortChange(['placementEndDate'], dir),
      width: 120,
      filterData: {
        filterName: 'placementEndDate',
        filterType: FilterType.Interval,
        intervalStartName: 'placementEndDateFrom',
        intervalEndName: 'placementEndDateTo'
      }
    },
    {
      id: 'cancellation',
      displayName: 'Дата окончания',
      transformFn: (d: BondDisplay): string => d.additionalInformation!.cancellation == null ? '' : new Date(d.additionalInformation!.cancellation).toLocaleDateString(),
      sortChangeFn: (dir): void => this.sortChange(['additionalInformation', 'cancellation'], dir),
      width: 110,
      filterData: {
        filterName: 'cancellation',
        filterType: FilterType.Interval,
        intervalStartName: 'cancellationFrom',
        intervalEndName: 'cancellationTo'
      }
    },
    {
      id: 'currentYield',
      displayName: 'Доходность, %',
      transformFn: (d: BondDisplay): string => d.yield?.currentYield == null ? '' : formatNumber(MathHelper.round(d.yield.currentYield, 2), this.locale, '0.0-2'),
      sortChangeFn: (dir): void => this.sortChange(['yield', 'currentYield'], dir),
      width: 120,
      filterData: {
        filterName: 'currentYield',
        filterType: FilterType.Interval,
        intervalStartName: 'currentYieldFrom',
        intervalEndName: 'currentYieldTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'issueValue',
      displayName: 'Заявл. объём выпуска',
      transformFn: (d: BondDisplay): string => d.volumes!.issueValue != null ? formatNumber(MathHelper.round(+d.volumes!.issueValue!, 2), this.locale, '0.0-2') : '',
      sortChangeFn: (dir): void => this.sortChange(['volumes', 'issueValue'], dir),
      width: 100,
      filterData: {
        filterName: 'issueValue',
        filterType: FilterType.Interval,
        intervalStartName: 'issueValueFrom',
        intervalEndName: 'issueValueTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'faceValue',
      displayName: 'Номинал',
      transformFn: (d: BondDisplay): string => d.faceValue != null ? formatNumber(MathHelper.round(d.faceValue, 2), this.locale, '0.0-2') : '',
      sortChangeFn: (dir): void => this.sortChange(['faceValue'], dir),
      width: 100,
      filterData: {
        filterName: 'faceValue',
        filterType: FilterType.Interval,
        intervalStartName: 'faceValueFrom',
        intervalEndName: 'faceValueTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'currentFaceValue',
      displayName: 'Ост. номинал',
      transformFn: (d: BondDisplay): string => d.currentFaceValue != null ? formatNumber(MathHelper.round(d.currentFaceValue, 2), this.locale, '0.0-2') : '',
      sortChangeFn: (dir): void => this.sortChange(['currentFaceValue'], dir),
      width: 100,
      filterData: {
        filterName: 'currentFaceValue',
        filterType: FilterType.Interval,
        intervalStartName: 'currentFaceValueFrom',
        intervalEndName: 'currentFaceValueTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'couponType',
      displayName: 'Тип купона',
      sortChangeFn: (dir): void => this.sortChange(['couponType'], dir),
      width: 110,
      filterData: {
        filterName: 'couponType',
        filterType: FilterType.DefaultMultiple,
        filters: [
          { value: 'FIXED', text: 'FIXED'},
          { value: 'FLOAT', text: 'FLOAT'},
          { value: 'UNKNOWN', text: 'UNKNOWN'}
        ]
      }
    },
    {
      id: 'couponRate',
      displayName: 'Ставка купона',
      transformFn: (d: BondDisplay): string => d.couponRate != null ? formatNumber(MathHelper.round(d.couponRate, 2), this.locale, '0.0-2') : '',
      sortChangeFn: (dir): void => this.sortChange(['couponRate'], dir),
      width: 90,
      filterData: {
        filterName: 'couponRate',
        filterType: FilterType.Interval,
        intervalStartName: 'couponRateFrom',
        intervalEndName: 'couponRateTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'couponAccruedInterest',
      displayName: 'НКД',
      transformFn: (d: BondDisplay): string => d.closestCoupon?.accruedInterest != null ? formatNumber(d.closestCoupon.accruedInterest, this.locale, '0.0-10') : '',
      filterData: {
        filterName: 'couponAccruedInterest',
        filterType: FilterType.Interval,
        intervalStartName: 'couponAccruedInterestFrom',
        intervalEndName: 'couponAccruedInterestTo'
      },
      width: 90,
    },
    {
      id: 'couponDate',
      displayName: 'Дата выплаты ближ. купона',
      transformFn: (d: BondDisplay): string => d.closestCoupon?.date == null ? '' : new Date(d.closestCoupon!.date).toLocaleDateString(),
      filterData: {
        filterName: 'couponDate',
        filterType: FilterType.Interval,
        intervalStartName: 'couponDateFrom',
        intervalEndName: 'couponDateTo'
      },
      width: 90,
    },
    {
      id: 'couponIntervalInDays',
      displayName: 'Период купона, д.',
      transformFn: (d: BondDisplay): string => d.closestCoupon?.intervalInDays?.toString() ?? '',
      filterData: {
        filterName: 'couponIntervalInDays',
        filterType: FilterType.Interval,
        intervalStartName: 'couponIntervalInDaysFrom',
        intervalEndName: 'couponIntervalInDaysTo',
      },
      width: 90,
    },
    {
      id: 'couponAmount',
      displayName: 'Размер купона',
      transformFn: (d: BondDisplay): string => d.closestCoupon?.amount != null ? formatNumber(d.closestCoupon.amount, this.locale, '0.0-10') : '',
      filterData: {
        filterName: 'couponAmount',
        filterType: FilterType.Interval,
        intervalStartName: 'couponAmountFrom',
        intervalEndName: 'couponAmountTo'
      },
      width: 90,
    },
    {
      id: 'offerDate',
      displayName: 'Дата ближайшей оферты',
      transformFn: (d: BondDisplay): string => d.closestOffer?.date == null ? '' : new Date(d.closestOffer!.date).toLocaleDateString(),
      filterData: {
        filterName: 'offerDate',
        filterType: FilterType.Interval,
        intervalStartName: 'offerDateFrom',
        intervalEndName: 'offerDateTo'
      },
      width: 90,
    },
    {
      id: 'priceMultiplier',
      displayName: 'Множитель цены',
      transformFn: (d: BondDisplay): string => d.additionalInformation!.priceMultiplier != null ? formatNumber(d.additionalInformation.priceMultiplier, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['additionalInformation', 'priceMultiplier'], dir),
      width: 110,
      filterData: {
        filterName: 'priceMultiplier',
        filterType: FilterType.Interval,
        intervalStartName: 'priceMultiplierFrom',
        intervalEndName: 'priceMultiplierTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'board',
      displayName: 'Режим торгов',
      transformFn: (d: BondDisplay): string => d.boardInformation!.board ?? '',
      sortChangeFn: (dir): void => this.sortChange(['boardInformation', 'board'], dir),
      width: 90,
      filterData: {
        filterName: 'board',
        filterType: FilterType.Search,
      }
    },
    {
      id: 'guaranteed',
      displayName: 'Гарантия',
      sortChangeFn: (dir): void => this.sortChange(['guaranteed'], dir),
      width: 100,
      filterData: {
        filterName: 'guaranteed',
        filterType: FilterType.Default,
        filters: [
          { value: true, text: 'Да'},
          { value: false, text: 'Нет'}
        ]
      }
    },
    {
      id: 'hasOffer',
      displayName: 'Есть оферта',
      sortChangeFn: (dir): void => this.sortChange(['hasOffer'], dir),
      width: 110,
      filterData: {
        filterName: 'hasOffer',
        filterType: FilterType.Default,
        filters: [
          { value: true, text: 'Да'},
          { value: false, text: 'Нет'}
        ]
      }
    },
    {
      id: 'hasAmortization',
      displayName: 'Есть амортизация',
      width: 110,
      filterData: {
        filterName: 'hasAmortization',
        filterType: FilterType.Default,
        filters: [
          { value: true, text: 'Да'},
          { value: false, text: 'Нет'}
        ]
      }
    },
    {
      id: 'duration',
      displayName: 'Дюрация, %',
      transformFn: (d: BondDisplay): string => d.duration != null ? formatNumber(d.duration, this.locale, '0.0-3') : '',
      sortChangeFn: (dir): void => this.sortChange(['duration'], dir),
      width: 90,
      filterData: {
        filterName: 'duration',
        filterType: FilterType.Interval,
        intervalStartName: 'durationFrom',
        intervalEndName: 'durationTo',
        inputFieldType: InputFieldType.Number,
      }
    },
    {
      id: 'durationMacaulay',
      displayName: 'Дюрация по Маколею, д.',
      transformFn: (d: BondDisplay): string => d.durationMacaulay != null ? formatNumber(d.durationMacaulay, this.locale, '0.0-3') : '',
      sortChangeFn: (dir): void => this.sortChange(['durationMacaulay'], dir),
      width: 90,
      filterData: {
        filterName: 'durationMacaulay',
        filterType: FilterType.Interval,
        intervalStartName: 'durationMacaulayFrom',
        intervalEndName: 'durationMacaulayTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'lotSize',
      displayName: 'Размер лота',
      transformFn: (d: BondDisplay): string => d.tradingDetails!.lotSize != null ? formatNumber(d.tradingDetails.lotSize, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'lotSize'], dir),
      width: 90,
      filterData: {
        filterName: 'lotSize',
        filterType: FilterType.Interval,
        intervalStartName: 'lotSizeFrom',
        intervalEndName: 'lotSizeTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'minStep',
      displayName: 'Шаг цены',
      transformFn: (d: BondDisplay): string => d.tradingDetails!.minStep != null ? formatNumber(d.tradingDetails!.minStep, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'minStep'], dir),
      width: 80,
      filterData: {
        filterName: 'minStep',
        filterType: FilterType.Interval,
        intervalStartName: 'minStepFrom',
        intervalEndName: 'minStepTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'price',
      displayName: 'Тек. цена',
      transformFn: (d: BondDisplay): string => d.tradingDetails!.price != null ? formatNumber(d.tradingDetails!.price, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'price'], dir),
      width: 80,
      filterData: {
        filterName: 'price',
        filterType: FilterType.Interval,
        intervalStartName: 'priceFrom',
        intervalEndName: 'priceTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'priceMax',
      displayName: 'Макс. цена',
      transformFn: (d: BondDisplay): string => d.tradingDetails!.priceMax != null ? formatNumber(d.tradingDetails!.priceMax, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceMax'], dir),
      width: 80,
      filterData: {
        filterName: 'priceMax',
        filterType: FilterType.Interval,
        intervalStartName: 'priceMaxFrom',
        intervalEndName: 'priceMaxTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'priceMin',
      displayName: 'Мин. цена',
      transformFn: (d: BondDisplay): string => d.tradingDetails!.priceMin != null ? formatNumber(d.tradingDetails!.priceMin, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceMin'], dir),
      width: 80,
      filterData: {
        filterName: 'priceMin',
        filterType: FilterType.Interval,
        intervalStartName: 'priceMinFrom',
        intervalEndName: 'priceMinTo',
        inputFieldType: InputFieldType.Number
      }
    },
    {
      id: 'priceStep',
      displayName: 'Стоимость шага цены',
      transformFn: (d: BondDisplay): string => d.tradingDetails!.priceStep != null ? formatNumber(d.tradingDetails!.priceStep, this.locale, '0.0-10') : '',
      sortChangeFn: (dir): void => this.sortChange(['tradingDetails', 'priceStep'], dir),
      width: 110,
      filterData: {
        filterName: 'priceStep',
        filterType: FilterType.Interval,
        intervalStartName: 'priceStepFrom',
        intervalEndName: 'priceStepTo',
        inputFieldType: InputFieldType.Number
      }
    }
  ];

  settingsTableName = 'bondScreenerTable';

  constructor() {
    const settingsService = inject(WidgetSettingsService);
    const destroyRef = inject(DestroyRef);

    super(settingsService, destroyRef);

    this.settingsService = settingsService;
    this.destroyRef = destroyRef;
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BondScreenerSettings>(this.guid())
      .pipe(shareReplay(1));

    super.ngOnInit();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.bondsList$.complete();
  }

  applyFilter(filters: DefaultTableFilters): void {
    const cleanedFilters = Object.keys(filters)
      .filter(key =>
        filters[key] != null &&
        (
          (typeof filters[key] === 'number') ||
          (typeof filters[key] === 'boolean') ||
          (filters[key] as string | string[]).length > 0
        )
      )
      .reduce((acc, curr) => {
        acc[curr] = filters[curr];
        return acc;
      }, {} as DefaultTableFilters);

    this.pagination = null;
    this.filters$.next(cleanedFilters);
  }

  rowClick(row: TableDataRow): void {
    const targetRow = row as BondDisplay;
    const instrument = {
      symbol: targetRow.basicInformation!.symbol,
      exchange: targetRow.basicInformation!.exchange,
    };

    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext.selectInstrument(instrument, s.badgeColor ?? defaultBadgeColor);
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

  openContextMenu($event: MouseEvent, menu: AddToWatchlistMenuComponent, selectedRow: TableDataRow): void {
    this.nzContextMenuService.close(true);

    const row = selectedRow as BondDisplay;
    const menuRef = menu.menuRef();
    if(menuRef != null) {
      menu.itemToAdd.set({
        symbol: row.basicInformation!.symbol,
        exchange:  row.basicInformation!.exchange
      });

      this.nzContextMenuService.create($event, menuRef);
    }
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
              transformFn: ['couponType', 'hasOffer', 'guaranteed', 'hasAmortization', 'complexProductCategory']
                .includes(col.column.id)
                  ? (data: BondDisplay): string => {
                    let columnValue = data[col.column.id as keyof BondDisplay]?.toString() ?? '';
                    columnValue = columnValue.length > 0 ? columnValue : data.basicInformation[col.column.id as keyof BasicInformation]?.toString() ?? '';
                    columnValue = columnValue.length > 0 ? columnValue : 'null';

                    return translate(
                      ['filters', col.column.id, columnValue],
                      { fallback: data[col.column.id as keyof BondDisplay] as string }
                    );
                  }
                  : col.column.transformFn,
              filterData: col.column.filterData && {
                ...col.column.filterData,
                filters: col.column.filterData.filters?.map(f => ({
                  text: translate(
                    ['filters', col.column.id, f.value.length > 0 ? f.value : 'null'],
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
        switchMap(([tableConfig, settings, filters, sort]) => {
          this.isLoading$.next(true);

          const columnIds = tableConfig.columns.map(c => c.id);

          const filtersWithDefaultValues = JSON.parse(JSON.stringify(filters)) as DefaultTableFilters;

          if ((settings.hideExpired ?? true) && filtersWithDefaultValues.cancellationFrom == null) {
            const dateNow = new Date();
            filtersWithDefaultValues.cancellationFrom = `${dateNow.getDate()}.${dateNow.getMonth() + 1}.${dateNow.getFullYear()}`;
          }

          return this.service.getBonds(
            columnIds,
            filtersWithDefaultValues,
            {
              first: this.loadingChunkSize,
              after: this.pagination?.endCursor ?? undefined,
              sort: sort == null ? null : [sort]
            })
            .pipe(
              map((res: BondsConnection | null) => res == null
                ? null
                : {
                  ...res,
                  edges: res.edges!.map((edge: BondsEdge) => ({
                    ...edge,
                    node: {
                      ...edge.node,
                      closestCoupon: ([...(edge.node.coupons ?? [])] as Coupon[])
                        .find((coupon: Coupon) => coupon.isClosest),
                      closestOffer: ([...(edge.node.offers ?? [])] as Offer[])
                        .find((offer: Offer) => offer.isClosest)
                    },
                  }))
                })
            );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        if (data == null) {
          return;
        }

        const newBonds = data.edges?.map((be: BondsEdge) => ({
          ...be.node,
          id: be.cursor
        } as BondDisplay)) ?? [];

        this.isLoading$.next(false);
        if (this.pagination == null) {
          this.bondsList$.next(newBonds);
          this.pagination = data?.pageInfo ?? null;
          return;
        }

        this.bondsList$
          .pipe(take(1))
          .subscribe(bonds => {
            this.bondsList$.next([...bonds, ...newBonds]);
            this.pagination = data?.pageInfo ?? null;
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
                b.basicInformation!.symbol === availableBadges[key]!.symbol &&
                b.basicInformation!.exchange as string === availableBadges[key]!.exchange
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
        return { [curr]: sort === 'descend' ? SortEnumType.Desc : SortEnumType.Asc };
      }
      return { [curr]: acc };
    }, {} as BondSortInput);

    this.sort$.next(sortObj);
  }
}
