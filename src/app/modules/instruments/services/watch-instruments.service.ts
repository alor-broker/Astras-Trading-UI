import {
  DestroyRef,
  Injectable
} from '@angular/core';
import {
  Observable,
  Subscription,
  switchMap,
  take
} from 'rxjs';
import {
  filter,
  map
} from 'rxjs/operators';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { WatchedInstrument } from '../models/watched-instrument.model';
import { WatchlistCollectionService } from './watchlist-collection.service';
import { InstrumentsService } from './instruments.service';
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { WatchlistItem } from "../models/watchlist.model";
import { WatchlistUpdatesState } from "../utils/watchlist-updates-state";
import { InstrumentsToWatchState } from "../utils/instruments-to-watch-state";
import { GuidGenerator } from "../../../shared/utils/guid";

@Injectable()
export class WatchInstrumentsService {
  private readonly watchlistUpdatesState = new WatchlistUpdatesState();
  private readonly instrumentsToWatchState = new InstrumentsToWatchState();

  private collectionChangeSubscription?: Subscription;


  constructor(
    private readonly history: HistoryService,
    private readonly quotesService: QuotesService,
    private readonly instrumentsService: InstrumentsService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    destroyRef: DestroyRef) {
    destroyRef.onDestroy(() => this.clear());
    destroyRef.onDestroy(() => this.watchlistUpdatesState.destroy());
  }

  clear() {
    this.watchlistUpdatesState.removeAll();
    this.instrumentsToWatchState.removeAll();

    this.collectionChangeSubscription?.unsubscribe();
  }

  getWatched(listId: string): Observable<WatchedInstrument[]> {
    this.clear();

    this.collectionChangeSubscription = this.watchlistCollectionService.getWatchlistCollection().pipe(
      map(currentCollection => currentCollection.collection.find(x => x.id === listId)),
      filter(x => !!x)
    ).subscribe(currentList => {
      this.refreshWatchItems(currentList!.items.map(item => ({
          ...item,
          recordId: item.recordId ?? GuidGenerator.newGuid(),
        })
      ));
    });

    return this.watchlistUpdatesState.updates$;
  }

  private refreshWatchItems(items: WatchlistItem[]) {
    const previousIds = new Set(this.instrumentsToWatchState.getCurrentItemIds());
    const currentIds = new Set<string>();

    items.forEach(item => {
      const currentRecordId = item.recordId;
      currentIds.add(currentRecordId);
      if (!previousIds.has(currentRecordId)) {
        this.instrumentsToWatchState.addItem(
          item,
          () => this.watchlistUpdatesState.removeItem(currentRecordId)
        );

        this.initInstrumentWatch(item);
      }
    });

    previousIds.forEach(id => {
      if (!currentIds.has(id)) {
        this.instrumentsToWatchState.removeItem(id);
      }
    });

  }

  private initInstrumentWatch(instrument: WatchlistItem) {
    this.instrumentsService.getInstrument(instrument).pipe(
      take(1),
      filter((x): x is Instrument => !!x),
      switchMap(i => {
        return this.history.getLastTwoCandles(i)
          .pipe(
            map(candles => <WatchedInstrument>{
              recordId: instrument.recordId,
              addTime: instrument.addTime ?? Date.now(),
              instrument: i,
              closePrice: candles?.prev?.close ?? 0,
              openPrice: candles?.cur.open ?? 0,
              prevTickPrice: 0,
              dayChange: 0,
              price: 0,
              minPrice: candles?.cur?.low,
              maxPrice: candles?.cur?.high,
              volume: candles?.cur?.volume,
              dayChangePerPrice: 0,
            }),
            take(1)
          );
      })
    ).subscribe(wi => {
      this.watchlistUpdatesState.addItem(wi);
      this.setupInstrumentUpdatesSubscription(wi);
    });
  }

  private setupInstrumentUpdatesSubscription(wi: WatchedInstrument) {
    const sub = this.quotesService.getQuotes(wi.instrument.symbol, wi.instrument.exchange, wi.instrument.instrumentGroup).subscribe(q => {
      const updatedInstrument = <WatchedInstrument>{
        ...wi,
        prevTickPrice: wi.price,
        closePrice: q.prev_close_price,
        openPrice: q.open_price,
        price: q.last_price,
        dayChange: q.change,
        dayChangePerPrice: q.change_percent,
        minPrice: q.low_price,
        maxPrice: q.high_price,
        volume: q.volume
      };

      this.watchlistUpdatesState.updateItem(updatedInstrument);
    });

    this.instrumentsToWatchState.setUpdatesSubscription(wi.recordId, sub);
  }
}
