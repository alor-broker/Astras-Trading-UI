import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  takeUntil
} from 'rxjs';
import {
  debounceTime,
  map,
  mergeMap,
  startWith
} from 'rxjs/operators';
import { Position } from 'src/app/shared/models/positions/position.model';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { Column } from '../../models/column.model';
import { PositionFilter } from '../../models/position-filter.model';
import { BlotterService } from '../../services/blotter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";
import { NzTableComponent } from 'ng-zorro-antd/table';
import { ExportHelper } from "../../utils/export-helper";
import { isEqualPortfolioDependedSettings } from "../../../../shared/utils/settings-helper";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { InstrumentBadges } from "../../../../shared/models/instruments/instrument.model";
import { Store } from "@ngrx/store";
import { getSelectedInstrumentsWithBadges } from "../../../../store/instruments/instruments.selectors";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { TableAutoHeightBehavior } from '../../utils/table-auto-height.behavior';
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { BlotterTablesHelper } from '../../utils/blotter-tables.helper';

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
  @ViewChild('tableContainer')
  tableContainer?: ElementRef<HTMLElement>;
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  displayPositions$: Observable<PositionDisplay[]> = of([]);
  searchFilter = new BehaviorSubject<PositionFilter>({});
  selectedInstruments$: Observable<InstrumentBadges> = of({});
  scrollHeight$: Observable<number> = of(100);
  tableInnerWidth: number = 1000;
  allColumns: Column<PositionDisplay, PositionFilter>[] = [
    {
      id: 'symbol',
      name: 'Тикер',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.symbol.localeCompare(b.symbol),
      searchDescription: 'Поиск по Тикеру',
      searchFn: (position, filter) => filter.symbol ? position.symbol.toLowerCase().includes(filter.symbol.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Биржевой идентификатор ценной бумаги',
      minWidth: 75
    },
    {
      id: 'shortName',
      name: 'Имя',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.shortName.localeCompare(b.shortName),
      searchDescription: 'Поиск по имени',
      searchFn: (position, filter) => filter.shortName ? position.shortName.toLowerCase().includes(filter.shortName.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Наименование позиции',
      minWidth: 70
    },
    {
      id: 'avgPrice',
      name: 'Средняя',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.avgPrice) - Number(b.avgPrice),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Средняя цена',
      minWidth: 70
    },
    {
      id: 'qtyT0',
      name: 'Кол-во Т0',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyT0) - Number(b.qtyT0),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Количество позиций с учётом сегодняшних расчётов',
      minWidth: 65
    },
    {
      id: 'qtyT1',
      name: 'Кол-во Т1',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyT1) - Number(b.qtyT1),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Количество позиций с учётом завтрашних расчётов',
      minWidth: 65
    },
    {
      id: 'qtyT2',
      name: 'Кол-во Т2',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyT2) - Number(b.qtyT2),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Количество позиций с учётом послезавтрашних расчётов',
      minWidth: 65
    },
    {
      id: 'qtyTFuture',
      name: 'Кол-во ТFuture',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyTFuture) - Number(b.qtyTFuture),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Количество позиций с учётом всех заявок',
      minWidth: 65
    },
    {
      id: 'volume',
      name: 'Объем',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.volume - b.volume,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Объём',
      minWidth: 60
    },
    {
      id: 'unrealisedPl',
      name: 'P/L всего',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.unrealisedPl - b.unrealisedPl,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Соотношение прибыли и убытка',
      minWidth: 60
    },
    {
      id: 'dailyUnrealisedPl',
      name: 'P/L дн.',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.dailyUnrealisedPl - b.dailyUnrealisedPl,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Соотношение прибыли и убытка за сегодня',
      minWidth: 60
    },
  ];
  listOfColumns: Column<PositionDisplay, PositionFilter>[] = [];
  private readonly columnDefaultWidth = 100;
  private settings$!: Observable<BlotterSettings>;
  private badgeColor = defaultBadgeColor;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly service: BlotterService,
    private readonly settingsService: WidgetSettingsService,
    private readonly store: Store,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get canExport(): boolean {
    return !!this.table?.data && this.table.data.length > 0;
  }

  isFilterDisabled = () => Object.keys(this.searchFilter.getValue()).length === 0;

  ngAfterViewInit(): void {
    if (this.tableContainer) {
      this.scrollHeight$ = TableAutoHeightBehavior.getScrollHeight(this.tableContainer);
    }
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid);

    this.settings$.pipe(
      distinctUntilChanged((previous, current) => TableSettingHelper.isTableSettingsEqual(previous?.positionsTable, current.positionsTable)),
      takeUntil(this.destroy$)
    ).subscribe(s => {
        const tableSettings = s.positionsTable ?? TableSettingHelper.toTableDisplaySettings(s.positionsColumns);

        if (tableSettings) {
          this.listOfColumns = this.allColumns
            .map(c => ({ column: c, columnSettings: tableSettings.columns.find(x => x.columnId === c.id) }))
            .filter(c => !!c.columnSettings)
            .map((column, index) => ({
              ...column.column,
              width: column.columnSettings!.columnWidth ?? this.columnDefaultWidth,
              order: column.columnSettings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index)
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

    this.selectedInstruments$ = combineLatest([
      this.store.select(getSelectedInstrumentsWithBadges),
      this.terminalSettingsService.getSettings()
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([badges, settings]) => {
          if (settings.badgesBind) {
            return badges;
          }
          return { [defaultBadgeColor]: badges[defaultBadgeColor] };
        })
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  filterChange(newFilter: PositionFilter) {
    this.searchFilter.next(newFilter);
  }

  getFilter(columnId: string) {
    return this.searchFilter.getValue()[columnId as keyof PositionFilter];
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

  isFilterApplied(column: Column<PositionDisplay, PositionFilter>) {
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

  saveColumnWidth(columnId: string, width: number) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      const tableSettings = settings.positionsTable ?? TableSettingHelper.toTableDisplaySettings(settings.positionsColumns);
      if (tableSettings) {
        this.settingsService.updateSettings<BlotterSettings>(
          settings.guid,
          {
            positionsTable: TableSettingHelper.updateColumn(
              columnId,
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

  private justifyFilter(position: PositionDisplay, filter: PositionFilter): boolean {
    let isFiltered = true;
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof PositionFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        if (!column!.searchFn!(position, filter)) {
          isFiltered = false;
        }
      }
    }
    return isFiltered;
  }
}
