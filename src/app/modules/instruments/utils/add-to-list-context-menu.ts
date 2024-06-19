import { ContextMenu } from "../../../shared/models/infinite-scroll-table.model";
import { WatchlistCollectionService } from "../services/watchlist-collection.service";
import { TranslatorService } from "../../../shared/services/translator.service";
import {
  combineLatest,
  Observable
} from "rxjs";
import { map } from "rxjs/operators";
import { WatchlistType } from "../models/watchlist.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

export class AddToListContextMenu {
  static getMenu<T>(
    watchlistCollectionService: WatchlistCollectionService,
    translatorService: TranslatorService,
    converter: (item: T) => InstrumentKey
  ): Observable<ContextMenu[]> {
    return combineLatest({
      watchlistCollection: watchlistCollectionService.getWatchlistCollection(),
      translator: translatorService.getTranslator('')
    }).pipe(
      map(x => {
        const availableWatchlists = x.watchlistCollection.collection.filter(c => c.type != WatchlistType.HistoryList);

        if (availableWatchlists.length === 0) {
          return [];
        }

        if (availableWatchlists.length === 1) {
          return [
            {
              title: x.translator(['addToList']),
              clickFn: (item: any): void => {
                watchlistCollectionService.addItemsToList(
                  availableWatchlists[0].id,
                  [converter(item)]
                );
              }
            }
          ];
        }

        return [
          {
            title: x.translator(['addToList']),
            subMenu: availableWatchlists
              .map(list => ({
                  title: list.title,
                  clickFn: (item: any): void => {
                    watchlistCollectionService.addItemsToList(
                      list.id,
                      [converter(item)]
                    );
                  }
                })
              )
          }
        ];
      })
    );
  }
}
