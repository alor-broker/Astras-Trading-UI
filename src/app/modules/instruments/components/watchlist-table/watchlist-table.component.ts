import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import {
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap
} from 'rxjs';
import { WatchedInstrument } from '../../models/watched-instrument.model';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import {
  filter,
  map
} from 'rxjs/operators';
import { getPropertyFromPath } from "../../../../shared/utils/object-helper";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { NzContextMenuService, NzDropdownMenuComponent } from "ng-zorro-antd/dropdown";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import {toInstrumentKey} from "../../../../shared/utils/instruments";
import { TableAutoHeightBehavior } from '../../../blotter/utils/table-auto-height.behavior';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import {
  InstrumentSelectSettings
} from '../../models/instrument-select-settings.model';
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import {WidgetsMetaService} from "../../../../shared/services/widgets-meta.service";

@Component({
  selector: 'ats-watchlist-table[guid]',
  templateUrl: './watchlist-table.component.html',
  styleUrls: ['./watchlist-table.component.less']
})
export class WatchlistTableComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input()
  guid!: string;

  @ViewChildren('tableContainer')
  tableContainer!: QueryList<ElementRef<HTMLElement>>;

  watchedInstruments$: Observable<WatchedInstrument[]> = of([]);

  scrollHeight$: Observable<number> = of(100);
  allColumns: BaseColumnSettings<WatchedInstrument>[] = [
    { id: 'symbol', displayName: "Тикер", tooltip: 'Биржевой идентификатор ценной бумаги', minWidth: 55 },
    { id: 'shortName', displayName: "Назв.", tooltip: 'Название тикера', minWidth: 60 },
    { id: 'price', displayName: "Цена", tooltip: 'Цена последней сделки' },
    { id: 'dayChange', displayName: "Д.изм.", tooltip: 'Изменение за день' },
    { id: 'dayChangePerPrice', displayName: "Д.изм.,%", tooltip: 'Изменение за день в %' },
    { id: 'maxPrice', displayName: "Д.макс.", tooltip: 'Максимальная цена за день' },
    { id: 'minPrice', displayName: "Д.мин.", tooltip: 'Минимальная цена за день' },
    { id: 'volume', displayName: "Объём", tooltip: 'Объём' },
    { id: 'openPrice', displayName: "Откр.", tooltip: 'Цена на начало дня' },
    { id: 'closePrice', displayName: "Закр.", tooltip: 'Цена на конец предыдущего дня' },
  ];
  displayedColumns: BaseColumnSettings<WatchedInstrument>[] = [];
  badgeColor: string = '';

  sortFns: { [keyName: string]: (a: InstrumentKey, b: InstrumentKey) => number } = {
    symbol: this.getSortFn('instrument.symbol'),
    price: this.getSortFn('price'),
    dayChange: this.getSortFn('dayChange'),
    dayChangePerPrice: this.getSortFn('dayChangePerPrice'),
    maxPrice: this.getSortFn('maxPrice'),
    minPrice: this.getSortFn('minPrice'),
    volume: this.getSortFn('volume'),
    openPrice: this.getSortFn('openPrice'),
    closePrice: this.getSortFn('closePrice'),
  };

  menuWidgets$!: Observable<string[] | null>;

  private selectedInstrument: InstrumentKey | null = null;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly currentDashboardService: DashboardContextService,
    private readonly settingsService: WidgetSettingsService,
    private readonly watchInstrumentsService: WatchInstrumentsService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly nzContextMenuService: NzContextMenuService,
    private readonly dashboardService: ManageDashboardsService,
    private readonly widgetsMetaService: WidgetsMetaService
  ) {
  }

  ngOnInit(): void {
    this.watchedInstruments$ = this.settingsService.getSettings<InstrumentSelectSettings>(this.guid).pipe(
      tap(settings => {
        this.displayedColumns = this.allColumns.filter(c => settings.instrumentColumns.includes(c.id));
        this.badgeColor = settings.badgeColor!;
      }),
      switchMap(settings => this.watchInstrumentsService.getWatched(settings)),
      shareReplay(1)
    );

    this.menuWidgets$ = this.widgetsMetaService.getWidgetsMeta().pipe(
      map(widgets => widgets.filter(x => x.hasInstrumentBind).map(x => x.typeId)),
      shareReplay(1)
    );
  }

  ngAfterViewInit(): void {
    const initHeightWatching = (ref: ElementRef<HTMLElement>) => this.scrollHeight$ = TableAutoHeightBehavior.getScrollHeight(ref);

    if (this.tableContainer.length > 0) {
      initHeightWatching(this.tableContainer!.first);
    }
    else {
      this.tableContainer?.changes.pipe(
        take(1)
      ).subscribe((x: QueryList<ElementRef<HTMLElement>>) => initHeightWatching(x.first));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.watchInstrumentsService.unsubscribe();
  }

  makeActive(instrumentKey: InstrumentKey) {
    this.currentDashboardService.selectDashboardInstrument(instrumentKey, this.badgeColor);
  }

  remove(instr: InstrumentKey) {
    this.settingsService.getSettings<InstrumentSelectSettings>(this.guid).pipe(
      map(s => s.activeListId),
      filter((id): id is string => !!id),
      take(1)
    ).subscribe(activeListId => {
      this.watchlistCollectionService.removeItemsFromList(activeListId, [instr]);
    });
  }

  getTrackKey(index: number, item: WatchedInstrument): string {
    return WatchlistCollectionService.getInstrumentKey(item.instrument);
  }

  isVisibleColumn(colName: string): boolean {
    return this.displayedColumns.map(c => c.id).includes(colName);
  }

  contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, selectedInstrument: InstrumentKey): void {
    this.selectedInstrument = selectedInstrument;
    this.nzContextMenuService.create($event, menu);
  }

  addWidget(type: string): void {
    this.dashboardService.addWidget(
      type,
      {
        linkToActive: false,
        ...toInstrumentKey(this.selectedInstrument!)
      }
    );
  }

  private getSortFn(propName: string): (a: InstrumentKey, b: InstrumentKey) => number {
    return (a: any, b: any) => {
      return getPropertyFromPath(a, propName) > getPropertyFromPath(b, propName) ? 1 : -1;
    };
  };
}
