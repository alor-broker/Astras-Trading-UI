import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Observable,
  of,
  switchMap,
  take,
  tap
} from 'rxjs';
import { WatchedInstrument } from '../../models/watched-instrument.model';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { selectNewInstrumentByBadge } from '../../../../store/instruments/instruments.actions';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import {
  filter,
  map
} from 'rxjs/operators';
import { getPropertyFromPath } from "../../../../shared/utils/object-helper";
import {
  allInstrumentsColumns,
  ColumnIds,
  InstrumentSelectSettings
} from "../../../../shared/models/settings/instrument-select-settings.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { NzContextMenuService, NzDropdownMenuComponent } from "ng-zorro-antd/dropdown";
import { WidgetNames } from "../../../../shared/models/enums/widget-names";
import { DashboardService } from "../../../../shared/services/dashboard.service";

@Component({
  selector: 'ats-watchlist-table[guid]',
  templateUrl: './watchlist-table.component.html',
  styleUrls: ['./watchlist-table.component.less']
})
export class WatchlistTableComponent implements OnInit {
  @Input()
  guid!: string;

  watchedInstruments$: Observable<WatchedInstrument[]> = of([]);
  displayedColumns: ColumnIds[] = [];
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
    WidgetNames.instrumentInfo
  ];

  private selectedInstrument: InstrumentKey | null = null;

  constructor(
    private readonly store: Store,
    private readonly settingsService: WidgetSettingsService,
    private readonly watchInstrumentsService: WatchInstrumentsService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly nzContextMenuService: NzContextMenuService,
    private readonly dashBoardService: DashboardService
  ) {
  }

  ngOnInit(): void {
    this.watchedInstruments$ = this.settingsService.getSettings<InstrumentSelectSettings>(this.guid).pipe(
      tap(settings => {
        this.displayedColumns = allInstrumentsColumns.filter(c => settings.instrumentColumns.includes(c.columnId));
        this.badgeColor = settings.badgeColor!;
      }),
      switchMap(settings => this.watchInstrumentsService.getWatched(settings)),
    );
  }

  makeActive(instrument: InstrumentKey) {
    this.store.dispatch(selectNewInstrumentByBadge({ instrument, badgeColor: this.badgeColor }));
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
    return this.displayedColumns.map(c => c.columnId).includes(colName);
  }

  contextMenu($event: MouseEvent, menu: NzDropdownMenuComponent, selectedInstrument: InstrumentKey): void {
    this.selectedInstrument = selectedInstrument;
    this.nzContextMenuService.create($event, menu);
  }

  addWidget(type: WidgetNames): void {
    const settings = {
      gridItem: {
        x: 0,
        y: 0,
        cols: 1,
        rows: 1,
        type: type,
      },
    };

    const additionalSettings = {
        linkToActive: false,
        ...this.selectedInstrument
      };

    this.dashBoardService.addWidget(settings, additionalSettings);
  }

  private getSortFn(propName: string): (a: InstrumentKey, b: InstrumentKey) => number {
    return (a: any, b: any) => {
      return getPropertyFromPath(a, propName) > getPropertyFromPath(b, propName) ? 1 : -1;
    };
  };
}
