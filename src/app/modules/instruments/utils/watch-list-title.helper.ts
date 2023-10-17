import {
  Watchlist,
  WatchlistType
} from "../models/watchlist.model";
import { WatchlistCollectionService } from "../services/watchlist-collection.service";

export class WatchListTitleHelper {
  static getTitleTranslationKey(list: Watchlist): string {
    if ((list.isDefault || list.type === WatchlistType.DefaultList) && list.title === WatchlistCollectionService.DefaultListName) {
      return 'defaultWatchlistTypeTitle';
    }

    if (list.type === WatchlistType.HistoryList) {
      return 'historyWatchlistTypeTitle';
    }

    return '';
  }
}
