import { Component, OnInit } from '@angular/core';
import { WatchList } from '../../models/watch-list.model';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'ats-watchlist-collection-edit',
  templateUrl: './watchlist-collection-edit.component.html',
  styleUrls: ['./watchlist-collection-edit.component.less']
})
export class WatchlistCollectionEditComponent implements OnInit {
  newListForm!: FormGroup;
  collection$?: Observable<WatchList[]>;

  constructor(private readonly watchlistCollectionService: WatchlistCollectionService) {
  }

  ngOnInit(): void {
    this.collection$ = this.watchlistCollectionService.collectionChanged$.pipe(
      startWith(null),
      map(() => this.watchlistCollectionService.getWatchlistCollection()),
      map(x => x.collection)
    );

    this.buildNewListForm();
  }

  changeListTitle(newTitle: string, targetList: WatchList) {
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

  removeList(listId: string) {
    this.watchlistCollectionService.removeList(listId);
  }

  private buildNewListForm() {
    this.newListForm = new FormGroup({
      title: new FormControl(null, [Validators.required, Validators.maxLength(100)])
    });
  }
}
