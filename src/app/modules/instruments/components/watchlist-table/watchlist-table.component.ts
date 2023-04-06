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
  combineLatest,
  Observable,
  of, Subject,
  switchMap,
  take, takeUntil,
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
import { WidgetNames } from "../../../../shared/models/enums/widget-names";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import {
  defaultBadgeColor,
  toInstrumentKey
} from "../../../../shared/utils/instruments";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { TableAutoHeightBehavior } from '../../../blotter/utils/table-auto-height.behavior';
import { InstrumentGroups } from '../../../../shared/models/dashboard/dashboard.model';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import {
  allInstrumentsColumns,
  ColumnId,
  InstrumentSelectSettings
} from '../../models/instrument-select-settings.model';

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
  selectedInstruments$: Observable<InstrumentGroups> = of({});

  scrollHeight$: Observable<number> = of(100);
  displayedColumns: ColumnId[] = [];
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
  showedWidgetNames = [
    WidgetNames.lightChart,
    WidgetNames.techChart,
    WidgetNames.orderBook,
    WidgetNames.scalperOrderBook,
    WidgetNames.allTrades,
    WidgetNames.instrumentInfo,
    WidgetNames.orderSubmit
  ];

  private selectedInstrument: InstrumentKey | null = null;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly currentDashboardService: DashboardContextService,
    private readonly settingsService: WidgetSettingsService,
    private readonly watchInstrumentsService: WatchInstrumentsService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly nzContextMenuService: NzContextMenuService,
    private readonly dashboardService: ManageDashboardsService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  ngOnInit(): void {
    this.watchedInstruments$ = this.settingsService.getSettings<InstrumentSelectSettings>(this.guid).pipe(
      takeUntil(this.destroy$),
      tap(settings => {
        this.displayedColumns = allInstrumentsColumns.filter(c => settings.instrumentColumns.includes(c.id));
        this.badgeColor = settings.badgeColor!;
      }),
      switchMap(settings => this.watchInstrumentsService.getWatched(settings)),
    );

    this.selectedInstruments$ = combineLatest([
      this.currentDashboardService.instrumentsSelection$,
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

  addWidget(type: WidgetNames): void {
    this.dashboardService.addWidget(
      type.toString(),
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
