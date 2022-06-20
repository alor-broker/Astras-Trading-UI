import { Component, OnInit } from '@angular/core';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { map, startWith } from 'rxjs/operators';
import { filter, Observable, shareReplay } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PresetWatchlist, PresetWatchlistCollection, Watchlist } from '../../models/watchlist.model';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';

@Component({
  selector: 'ats-watchlist-collection-edit',
  templateUrl: './watchlist-collection-edit.component.html',
  styleUrls: ['./watchlist-collection-edit.component.less']
})
export class WatchlistCollectionEditComponent implements OnInit {
  newListForm!: FormGroup;
  collection$?: Observable<Watchlist[]>;
  presetCollection$?: Observable<PresetWatchlist[]>;
  selectedPresetWatchlist?: PresetWatchlist | null = null;

  constructor(private readonly watchlistCollectionService: WatchlistCollectionService) {
  }

  ngOnInit(): void {
    this.collection$ = this.watchlistCollectionService.collectionChanged$.pipe(
      startWith(null),
      map(() => this.watchlistCollectionService.getWatchlistCollection()),
      map(x => x.collection)
    );

    this.presetCollection$ = this.watchlistCollectionService.getPresetCollection()
      .pipe(
        filter((x): x is  PresetWatchlistCollection => !!x),
        filter(x => x.list?.length > 0),
        map(x => x.list),
        map(x => x.filter(list => list.papers?.length > 0)),
        shareReplay()
      );

    this.buildNewListForm();
  }

  changeListTitle(newTitle: string, targetList: Watchlist) {
    if (newTitle?.length > 0) {
      this.watchlistCollectionService.updateListMeta(targetList.id, { title: newTitle });
    }
  }

  addNewList() {
    if (!this.newListForm.valid) {
      return;
    }

    this.watchlistCollectionService.createNewList(this.newListForm.value.title, []);
    this.newListForm.reset();
  }

  addPresetList() {
    if (this.selectedPresetWatchlist != null) {
      this.watchlistCollectionService.createNewList(
        this.selectedPresetWatchlist.name,
        this.selectedPresetWatchlist.papers.map(x => ({
          symbol: x.symbol,
          exchange: x.exchange,
          instrumentGroup: x.board
        } as InstrumentKey))
      );

      this.selectedPresetWatchlist = null;
    }
  }

  removeList(listId: string) {
    this.watchlistCollectionService.removeList(listId);
  }

  private buildNewListForm() {
    this.newListForm = new FormGroup({
      title: new FormControl(null, [Validators.required, Validators.maxLength(100)])
    });
  }
}
