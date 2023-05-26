import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  of, shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil
} from 'rxjs';
import {
  debounceTime, filter,
  map,
  mergeMap,
  startWith
} from 'rxjs/operators';
import { Position } from 'src/app/shared/models/positions/position.model';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { PositionFilter } from '../../models/position-filter.model';
import { BlotterService } from '../../services/blotter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { NzTableComponent } from 'ng-zorro-antd/table';
import { ExportHelper } from "../../utils/export-helper";
import { isEqualPortfolioDependedSettings } from "../../../../shared/utils/settings-helper";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { TableAutoHeightBehavior } from '../../utils/table-auto-height.behavior';
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { BlotterTablesHelper } from '../../utils/blotter-tables.helper';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { BlotterSettings } from '../../models/blotter-settings.model';
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import {NzTableFilterList} from "ng-zorro-antd/table/src/table.types";

interface PositionDisplay extends Position {
  volume: number
}

@Component({
  selector: 'ats-positions[shouldShowSettings][guid]',
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.less']
})
export class PositionsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('nzTable')
  table?: NzTableComponent<PositionDisplay>;
  @ViewChildren('tableContainer')
  tableContainer!: QueryList<ElementRef<HTMLElement>>;
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  displayPositions$: Observable<PositionDisplay[]> = of([]);
  searchFilter = new BehaviorSubject<PositionFilter>({});
  readonly scrollHeight$ = new BehaviorSubject<number>(100);
  tableInnerWidth: number = 1000;
  allColumns: BaseColumnSettings<PositionDisplay>[] = [
    {
      id: 'symbol',
      displayName: 'Тикер',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.symbol.localeCompare(b.symbol),
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
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.shortName.localeCompare(b.shortName),
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
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.avgPrice) - Number(b.avgPrice),
      tooltip: 'Средняя цена',
      minWidth: 70
    },
    {
      id: 'qtyT0',
      displayName: 'Кол-во Т0',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyT0) - Number(b.qtyT0),
      tooltip: 'Количество позиций с учётом сегодняшних расчётов',
      minWidth: 65
    },
    {
      id: 'qtyT1',
      displayName: 'Кол-во Т1',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyT1) - Number(b.qtyT1),
      tooltip: 'Количество позиций с учётом завтрашних расчётов',
      minWidth: 65
    },
    {
      id: 'qtyT2',
      displayName: 'Кол-во Т2',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyT2) - Number(b.qtyT2),
      tooltip: 'Количество позиций с учётом послезавтрашних расчётов',
      minWidth: 65
    },
    {
      id: 'qtyTFuture',
      displayName: 'Кол-во ТFuture',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyTFuture) - Number(b.qtyTFuture),
      tooltip: 'Количество позиций с учётом всех заявок',
      minWidth: 65
    },
    {
      id: 'volume',
      displayName: 'Объем',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.volume - b.volume,
      tooltip: 'Объём',
      minWidth: 60
    },
    {
      id: 'unrealisedPl',
      displayName: 'P/L всего',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.unrealisedPl - b.unrealisedPl,
      tooltip: 'Соотношение прибыли и убытка',
      minWidth: 60
    },
    {
      id: 'dailyUnrealisedPl',
      displayName: 'P/L дн.',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.dailyUnrealisedPl - b.dailyUnrealisedPl,
      tooltip: 'Соотношение прибыли и убытка за сегодня',
      minWidth: 60
    },
  ];
  listOfColumns: BaseColumnSettings<PositionDisplay>[] = [];
  private readonly columnDefaultWidth = 100;
  private settings$!: Observable<BlotterSettings>;
  private badgeColor = defaultBadgeColor;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly service: BlotterService,
    private readonly settingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly translatorService: TranslatorService
  ) {
  }

  get canExport(): boolean {
    return !!this.table?.data && this.table.data.length > 0;
  }

  isFilterDisabled = () => Object.keys(this.searchFilter.getValue()).length === 0;

  ngAfterViewInit(): void {
    const container$ =  this.tableContainer.changes.pipe(
      map(x => x.first),
      startWith(this.tableContainer.first),
      filter((x): x is ElementRef<HTMLElement> => !!x),
      shareReplay(1)
    );

    container$.pipe(
      switchMap(x => TableAutoHeightBehavior.getScrollHeight(x)),
      takeUntil(this.destroy$)
    ).subscribe(x => {
      setTimeout(()=> this.scrollHeight$.next(x));
    });
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid);

    this.settings$.pipe(
      distinctUntilChanged((previous, current) =>
        TableSettingHelper.isTableSettingsEqual(previous?.positionsTable, current.positionsTable)
        && previous.badgeColor === current.badgeColor
      ),
      mapWith(
        () => this.translatorService.getTranslator('blotter/positions'),
        (s, t) => ({ s, t })
      ),
      takeUntil(this.destroy$)
    ).subscribe(({ s, t }) => {
        const tableSettings = s.positionsTable ?? TableSettingHelper.toTableDisplaySettings(s.positionsColumns);

        if (tableSettings) {
          this.listOfColumns = this.allColumns
            .map(c => ({ column: c, columnSettings: tableSettings.columns.find(x => x.columnId === c.id) }))
            .filter(c => !!c.columnSettings)
            .map((column, index) => ({
              ...column.column,
              displayName: t(['columns', column.column.id, 'name'], { fallback: column.column.displayName }),
              tooltip: t(['columns', column.column.id, 'tooltip'], { fallback: column.column.tooltip }),
              width: column.columnSettings!.columnWidth ?? this.columnDefaultWidth,
              order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index),
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
            }))
            .sort((a, b) => a.order - b.order);
        }

        this.tableInnerWidth = this.listOfColumns.reduce((prev, cur) => prev + cur.width!, 0);
        this.badgeColor = s.badgeColor!;
      }
    );

    this.displayPositions$ = this.settings$.pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      switchMap(settings => this.service.getPositions(settings)),
      debounceTime(100),
      startWith([]),
      map(positions => positions.map(p => <PositionDisplay>{
        ...p,
        volume: this.round(Number(p.avgPrice) * Math.abs(Number(p.qtyUnits)))
      })),
      mergeMap(positions => this.searchFilter.pipe(
        map(f => positions.filter(o => this.justifyFilter(o, f)))
      ))
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.scrollHeight$.complete();
  }

  filterChange(newFilter: PositionFilter) {
    this.searchFilter.next(newFilter);
  }

  round(number: number) {
    return MathHelper.round(number, 2);
  }

  roundPrice(price: number) {
    return price > 10
      ? MathHelper.round(price, 2)
      : MathHelper.round(price, 6);
  }

  selectInstrument(symbol: string, exchange: string) {
    this.service.selectNewInstrument(symbol, exchange, this.badgeColor);
  }

  isFilterApplied(column: BaseColumnSettings<PositionDisplay>) {
    const filter = this.searchFilter.getValue();
    return column.id in filter && !!filter[column.id];
  }

  exportToFile() {
    this.settings$.pipe(take(1)).subscribe(settings => {
      ExportHelper.exportToCsv(
        'Позиции',
        settings,
        [...this.table?.data ?? []],
        this.listOfColumns
      );
    });
  }

  saveColumnWidth(id: string, width: number) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      const tableSettings = settings.positionsTable ?? TableSettingHelper.toTableDisplaySettings(settings.positionsColumns);
      if (tableSettings) {
        this.settingsService.updateSettings<BlotterSettings>(
          settings.guid,
          {
            positionsTable: TableSettingHelper.updateColumn(
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

  changeColumnOrder(event: CdkDragDrop<any>) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      this.settingsService.updateSettings<BlotterSettings>(
        settings.guid,
        {
          positionsTable: BlotterTablesHelper.changeColumnOrder(
            event,
            settings.positionsTable ?? TableSettingHelper.toTableDisplaySettings(settings.positionsColumns)!,
            this.listOfColumns
          )
        }
      );
    });
  }

  trackBy(index: number, position: PositionDisplay): string {
    return `${position.symbol}_${position.exchange}`;
  }

  private justifyFilter(position: PositionDisplay, filter: PositionFilter): boolean {
    let isFiltered = true;
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof PositionFilter]) {
        if (filter[key] && !position[<keyof PositionDisplay>key].toString().toLowerCase().includes(filter[key]!.toLowerCase())) {
          isFiltered = false;
        }
      }
    }
    return isFiltered;
  }
}
