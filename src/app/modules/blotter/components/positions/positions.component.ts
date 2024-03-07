import { Component, DestroyRef, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { distinctUntilChanged, iif, Observable, of, switchMap } from 'rxjs';
import { debounceTime, map, mergeMap, startWith } from 'rxjs/operators';
import { Position } from 'src/app/shared/models/positions/position.model';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { PositionFilter } from '../../models/position-filter.model';
import { BlotterService } from '../../services/blotter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { isEqualPortfolioDependedSettings } from "../../../../shared/utils/settings-helper";
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { BlotterSettings, ColumnsNames, TableNames } from '../../models/blotter-settings.model';
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BlotterBaseTableComponent } from "../blotter-base-table/blotter-base-table.component";
import { OrderService } from "../../../../shared/services/orders/order.service";
import { CommonOrderCommands } from "../../../../shared/utils/common-order-commands";
import { MarketType } from "../../../../shared/models/portfolio-key.model";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { ACTIONS_CONTEXT, ActionsContext } from "../../../../shared/services/actions-context";

interface PositionDisplay extends Position {
  id: string;
  volume: number;
}

@Component({
  selector: 'ats-positions',
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.less']
})
export class PositionsComponent extends BlotterBaseTableComponent<PositionDisplay, PositionFilter> implements OnInit {
  @Input()
  marketType?: MarketType | null;
  marketTypes = MarketType;

  portfolioTotalCost$!: Observable<number>;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  displayPositions$: Observable<PositionDisplay[]> = of([]);
  allColumns: BaseColumnSettings<PositionDisplay>[] = [
    {
      id: 'symbol',
      displayName: 'Тикер',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay): number => a.symbol.localeCompare(b.symbol),
      filterData: {
        filterName: 'symbol',
        isDefaultFilter: false
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
        isDefaultFilter: false
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
  constructor(
    private readonly service: BlotterService,
    protected readonly settingsService: WidgetSettingsService,
    protected readonly translatorService: TranslatorService,
    protected readonly ordersService: OrderService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    @Inject(ACTIONS_CONTEXT) protected readonly actionsContext: ActionsContext,
    protected readonly destroyRef: DestroyRef
  ) {
    super(settingsService, translatorService, destroyRef, actionsContext);
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.portfolioTotalCost$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(s => iif(
          () => this.marketType === MarketType.Forward,
          this.portfolioSubscriptionsService.getSpectraRisksSubscription(s.portfolio, s.exchange)
            .pipe(map(i => {
              return i.moneyAmount;
            })),
          this.portfolioSubscriptionsService.getSummariesSubscription(s.portfolio, s.exchange)
            .pipe(map(i => {
              return i.portfolioLiquidationValue;
            }))
        ))
    );
  }

  protected initTableConfig(): void {
    this.tableConfig$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous.positionsTable, current.positionsTable)
        && previous.badgeColor === current.badgeColor
      ),
      mapWith(
        () => this.translatorService.getTranslator('blotter/positions'),
        (s, t) => ({ s, t })
      ),
      takeUntilDestroyed(this.destroyRef),
      map(({ s, t }) => {
        const tableSettings = TableSettingHelper.toTableDisplaySettings(s.positionsTable, s.positionsColumns);

        return {
          columns: this.allColumns
            .map(c => ({ column: c, columnSettings: tableSettings?.columns.find(x => x.columnId === c.id) }))
            .filter(c => !!c.columnSettings)
            .map((column, index) => ({
              ...column.column,
              displayName: t(['columns', column.column.id, 'name'], { fallback: column.column.displayName }),
              tooltip: t(['columns', column.column.id, 'tooltip'], { fallback: column.column.tooltip }),
              width: column.columnSettings!.columnWidth ?? this.defaultColumnWidth,
              order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index),
              filterData: column.column.filterData
                ? {
                  ...column.column.filterData,
                  filterName: t(['columns', column.column.id, 'name'], {fallback: column.column.displayName}),
                  filters: (column.column.filterData.filters ?? []).map(f => ({
                    value: f.value as unknown,
                    text: t(['columns', column.column.id, 'listOfFilter', f.value], {fallback: f.text})
                  }))
                }
                : undefined,
            }))
            .sort((a, b) => a.order - b.order)
        };
      })
    );
  }

  protected initTableData(): void {
    this.tableData$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(
        settings => this.service.getPositions(settings)
          .pipe(
            map((positions) => positions.map(p => ({
              ...p,
              id: `${p.symbol}_${p.exchange}`,
              dailyUnrealisedPlRatio: p.dailyUnrealisedPl * 100 / p.volume,
              unrealisedPlRatio: p.unrealisedPl * 100 / p.volume
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

  round(number: number): number {
    return MathHelper.round(number, 2);
  }

  closePosition(position: PositionDisplay): void {
    CommonOrderCommands.closePositionByMarket(position, null, this.ordersService);
  }

  reversePosition(position: PositionDisplay): void {
    CommonOrderCommands.reversePositionsByMarket(position, null, this.ordersService);
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
}
