import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of, switchMap, take } from 'rxjs';
import { WatchedInstrument } from '../../models/watched-instrument.model';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { selectNewInstrument } from '../../../../store/instruments/instruments.actions';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { filter, map } from 'rxjs/operators';
import { getPropertyFromPath } from "../../../../shared/utils/object-helper";

@Component({
  selector: 'ats-watchlist-table[guid]',
  templateUrl: './watchlist-table.component.html',
  styleUrls: ['./watchlist-table.component.less']
})
export class WatchlistTableComponent implements OnInit {
  @Input()
  guid!: string;

  watchedInstruments$: Observable<WatchedInstrument[]> = of([]);

  sortFns = {
    symbol: this.getSortFn('instrument.symbol'),
    price: this.getSortFn('price'),
    dayChange: this.getSortFn('dayChange'),
    dayChangePerPrice: this.getSortFn('dayChangePerPrice'),
  };

  constructor(
    private readonly store: Store,
    private readonly watchInstrumentsService: WatchInstrumentsService,
    private readonly watchlistCollectionService: WatchlistCollectionService
  ) {
  }

  ngOnInit(): void {
    this.watchedInstruments$ = this.watchInstrumentsService.getSettings(this.guid).pipe(
      switchMap(settings => this.watchInstrumentsService.getWatched(settings))
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

  private getSortFn(propName: string): (a: InstrumentKey, b: InstrumentKey) => number {
    return (a: any, b: any) => {
      return getPropertyFromPath(a, propName) > getPropertyFromPath(b, propName) ? 1 : -1;
    };
  };
}
