import {
  Component,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  combineLatest,
  Observable
} from "rxjs";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { WatchlistCollectionService } from "../../services/watchlist-collection.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { map } from "rxjs/operators";
import { WatchlistType } from "../../models/watchlist.model";
import { NzDropdownMenuComponent } from "ng-zorro-antd/dropdown";

interface MenuItem {
  title: string;
  itemId?: string;
  subItems: MenuItem[];
}

@Component({
  selector: 'ats-add-to-watchlist-menu',
  templateUrl: './add-to-watchlist-menu.component.html',
  styleUrl: './add-to-watchlist-menu.component.less'
})
export class AddToWatchlistMenuComponent implements OnInit {
  menuItems$!: Observable<MenuItem[]>;

  @Input()
  itemToAdd: InstrumentKey | null = null;

  @ViewChild(NzDropdownMenuComponent)
  menuRef: NzDropdownMenuComponent | null = null;

  constructor(
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly translatorService: TranslatorService,
  ) {
  }

  ngOnInit(): void {
    this.menuItems$ = this.getMenuItems();
  }

  selectItem(item: MenuItem): void {
    if (item.itemId == null || this.itemToAdd == null) {
      return;
    }

    this.watchlistCollectionService.addItemsToList(item.itemId, [this.itemToAdd]);
  }

  private getMenuItems(): Observable<MenuItem[]> {
    return combineLatest({
      watchlistCollection: this.watchlistCollectionService.getWatchlistCollection(),
      translator: this.translatorService.getTranslator('')
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
              itemId: availableWatchlists[0].id,
              subItems: []
            }
          ];
        }

        return [
          {
            title: x.translator(['addToList']),
            subItems: availableWatchlists
              .map(list => ({
                  title: list.title,
                  itemId: list.id,
                  subItems: []
                })
              )
          }
        ];
      })
    );
  }
}
