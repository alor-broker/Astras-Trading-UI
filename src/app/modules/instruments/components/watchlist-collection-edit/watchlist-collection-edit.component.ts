import { Component, OnInit, inject } from '@angular/core';
import {WatchlistCollectionService} from '../../services/watchlist-collection.service';
import {map} from 'rxjs/operators';
import {filter, Observable, shareReplay, Subject} from 'rxjs';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  PresetWatchlist,
  PresetWatchlistCollection,
  PresetWatchlistItem,
  Watchlist,
  WatchlistType
} from '../../models/watchlist.model';
import {InstrumentKey} from '../../../../shared/models/instruments/instrument-key.model';
import {WatchListTitleHelper} from "../../utils/watch-list-title.helper";
import {
  ExportDialogParams,
  ExportWatchlistDialogComponent
} from "../export-watchlist-dialog/export-watchlist-dialog.component";
import {
  ImportDialogParams,
  ImportWatchlistDialogComponent
} from "../import-watchlist-dialog/import-watchlist-dialog.component";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzListComponent,
  NzListEmptyComponent,
  NzListItemActionComponent,
  NzListItemActionsComponent,
  NzListItemComponent
} from 'ng-zorro-antd/list';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzPopconfirmDirective} from 'ng-zorro-antd/popconfirm';
import {NzDropdownButtonDirective, NzDropDownDirective, NzDropdownMenuComponent} from 'ng-zorro-antd/dropdown';
import {NzMenuDirective, NzMenuItemComponent} from 'ng-zorro-antd/menu';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-watchlist-collection-edit',
  templateUrl: './watchlist-collection-edit.component.html',
  styleUrls: ['./watchlist-collection-edit.component.less'],
  imports: [
    TranslocoDirective,
    NzListComponent,
    NzListItemComponent,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzInputDirective,
    NzListItemActionsComponent,
    NzListItemActionComponent,
    NzButtonComponent,
    NzTooltipDirective,
    NzIconDirective,
    NzSelectComponent,
    NzOptionComponent,
    NzTypographyComponent,
    NzPopconfirmDirective,
    NzDropdownButtonDirective,
    NzDropDownDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzListEmptyComponent,
    ExportWatchlistDialogComponent,
    ImportWatchlistDialogComponent,
    AsyncPipe
  ]
})
export class WatchlistCollectionEditComponent implements OnInit {
  private readonly watchlistCollectionService = inject(WatchlistCollectionService);
  private readonly formBuilder = inject(FormBuilder);

  readonly exportDialogParams$ = new Subject<ExportDialogParams | null>();
  readonly importDialogParams$ = new Subject<ImportDialogParams | null>();

  readonly newListForm = this.formBuilder.group({
    title: this.formBuilder.nonNullable.control<string>(
      '',
      [
        Validators.required,
        Validators.maxLength(100)
      ]
    )
  });

  collection$?: Observable<Watchlist[]>;
  presetCollection$?: Observable<PresetWatchlist[]>;
  selectedPresetWatchlist?: PresetWatchlist | null = null;

  getTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;

  ngOnInit(): void {
    this.collection$ = this.watchlistCollectionService.getWatchlistCollection().pipe(
      map(x => x.collection)
    );

    this.presetCollection$ = this.watchlistCollectionService.getPresetCollection()
      .pipe(
        filter((x): x is PresetWatchlistCollection => !!x),
        filter(x => x.list.length > 0),
        map(x => x.list),
        map(x => x.filter(list => (list.papers as PresetWatchlistItem[] | undefined ?? []).length > 0)),
        shareReplay()
      );
  }

  changeListTitle(newTitle: string, targetList: Watchlist): void {
    if (newTitle.length > 0) {
      this.watchlistCollectionService.updateListMeta(targetList.id, {title: newTitle});
    }
  }

  addNewList(): void {
    if (!this.newListForm.valid) {
      return;
    }

    this.watchlistCollectionService.createNewList(this.newListForm.value.title!, []);
    this.newListForm.reset();
  }

  addPresetList(): void {
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

  removeList(listId: string): void {
    this.watchlistCollectionService.removeList(listId);
  }

  isRemovable(list: Watchlist): boolean {
    return !((list.isDefault ?? false) || list.type === WatchlistType.DefaultList || list.type === WatchlistType.HistoryList);
  }

  hasEditableTitle(list: Watchlist): boolean {
    return list.type !== WatchlistType.HistoryList;
  }

  canImport(list: Watchlist): boolean {
    return list.type !== WatchlistType.HistoryList;
  }
}
