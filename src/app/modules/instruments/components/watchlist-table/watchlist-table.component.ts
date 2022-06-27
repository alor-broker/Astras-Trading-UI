import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of, switchMap, take, tap } from 'rxjs';
import { WatchedInstrument } from '../../models/watched-instrument.model';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { selectNewInstrument } from '../../../../store/instruments/instruments.actions';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { filter, map } from 'rxjs/operators';
import { getPropertyFromPath } from "../../../../shared/utils/object-helper";
import { allInstrumentsColumns, ColumnIds } from "../../../../shared/models/settings/instrument-select-settings.model";

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

  constructor(
    private readonly store: Store,
    private readonly watchInstrumentsService: WatchInstrumentsService,
    private readonly watchlistCollectionService: WatchlistCollectionService
  ) {
  }

  ngOnInit(): void {
    this.watchedInstruments$ = this.watchInstrumentsService.getSettings(this.guid).pipe(
      tap(settings => {
        this.displayedColumns = allInstrumentsColumns.filter(c => settings.instrumentColumns.includes(c.columnId));
      }),
      switchMap(settings => this.watchInstrumentsService.getWatched(settings)),
    );
  }

  makeActive(instrument: InstrumentKey) {
    this.store.dispatch(selectNewInstrument({ instrument }));
  }

  remove(instr: InstrumentKey) {
    this.watchInstrumentsService.getSettings(this.guid).pipe(
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

  private getSortFn(propName: string): (a: InstrumentKey, b: InstrumentKey) => number {
    return (a: any, b: any) => {
      return getPropertyFromPath(a, propName) > getPropertyFromPath(b, propName) ? 1 : -1;
    };
  };
}
