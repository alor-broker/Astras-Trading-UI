import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {WatchlistCollectionService} from '@terminal-core-lib/features/watchlist/services/watchlist-collection.service';
import {
  filter,
  map,
  Observable,
  shareReplay,
  Subject
} from "rxjs";
import {
  ExportDialogParams,
  ExportWatchlistDialog
} from "../export-watchlist-dialog/export-watchlist-dialog";
import {
  ImportDialogParams,
  ImportWatchlistDialog
} from "../import-watchlist-dialog/import-watchlist-dialog";
import {
  PresetWatchlist,
  PresetWatchlistCollection,
  PresetWatchlistItem,
  Watchlist,
  WatchlistType
} from "@terminal-core-lib/features/watchlist/types/watchlist.types";
import {WatchListTitleHelper} from '@terminal-core-lib/features/watchlist/utils/watchlist-title.hepler';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {NzListModule} from 'ng-zorro-antd/list';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzPopconfirmDirective} from 'ng-zorro-antd/popconfirm';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {
  NzMenuDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';

@Component({
  selector: 'ats-watchlist-collection-edit',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    ReactiveFormsModule,
    NzFormModule,
    NzInputDirective,
    NzButtonComponent,
    NzTooltipDirective,
    NzIconDirective,
    NzSelectComponent,
    FormsModule,
    NzOptionComponent,
    NzTypographyComponent,
    NzPopconfirmDirective,
    NzDropdownDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    ExportWatchlistDialog,
    ImportWatchlistDialog,
    NzListModule
  ],
  templateUrl: './watchlist-collection-edit.html',
  styleUrl: './watchlist-collection-edit.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistCollectionEdit implements OnInit {
  readonly exportDialogParams$ = new Subject<ExportDialogParams | null>();

  readonly importDialogParams$ = new Subject<ImportDialogParams | null>();

  collection$?: Observable<Watchlist[]>;

  presetCollection$?: Observable<PresetWatchlist[]>;

  selectedPresetWatchlist?: PresetWatchlist | null = null;

  getTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;

  private readonly watchlistCollectionService = inject(WatchlistCollectionService);

  private readonly formBuilder = inject(FormBuilder);

  readonly newListForm = this.formBuilder.group({
    title: this.formBuilder.nonNullable.control<string>(
      '',
      [
        Validators.required,
        Validators.maxLength(100)
      ]
    )
  });

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
