import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {WatchlistCollectionService} from '@terminal-core-lib/features/watchlist/services/watchlist-collection.service';
import {
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
  PresetWatchlistItem,
  Watchlist,
  WatchlistType
} from "@terminal-core-lib/features/watchlist/types/watchlist.types";
import {WatchListTitleHelper} from '@terminal-core-lib/features/watchlist/utils/watchlist-title.hepler';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {NzListModule} from 'ng-zorro-antd/list';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
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
import {
  NzSegmentedComponent,
  NzSegmentedItemComponent
} from 'ng-zorro-antd/segmented';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';
import {WatchlistCreationMode} from './watchlist-collection-edit.types';

@Component({
  selector: 'ats-watchlist-collection-edit',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    ReactiveFormsModule,
    WidgetSettingsForm,
    WidgetSettingsFormItem,
    NzSegmentedComponent,
    NzSegmentedItemComponent,
    NzInputDirective,
    NzButtonComponent,
    NzIconDirective,
    NzSelectComponent,
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

  readonly WatchlistCreationMode = WatchlistCreationMode;

  readonly validationOptions = {
    titleMaxLength: 100
  };

  getTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;

  private readonly watchlistCollectionService = inject(WatchlistCollectionService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly formBuilder = inject(FormBuilder);

  readonly creationMode = this.formBuilder.nonNullable.control(WatchlistCreationMode.Empty);

  readonly presetListForm = this.formBuilder.group({
    list: this.formBuilder.control<PresetWatchlist | null>(null, Validators.required)
  });

  readonly newListForm = this.formBuilder.group({
    title: this.formBuilder.nonNullable.control<string>(
      '',
      [
        Validators.required,
        Validators.maxLength(this.validationOptions.titleMaxLength)
      ]
    )
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.exportDialogParams$.complete();
      this.importDialogParams$.complete();
    });
  }

  ngOnInit(): void {
    this.collection$ = this.watchlistCollectionService.getWatchlistCollection().pipe(
      map(x => x.collection)
    );

    this.presetCollection$ = this.watchlistCollectionService.getPresetCollection()
      .pipe(
        map(x => x?.list ?? []),
        map(x => x.filter(list => (list.papers as PresetWatchlistItem[] | undefined ?? []).length > 0)),
        shareReplay({bufferSize: 1, refCount: true})
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

    this.watchlistCollectionService.createNewList(this.newListForm.controls.title.value, []);
    this.newListForm.reset();
  }

  addPresetList(): void {
    const selectedList = this.presetListForm.controls.list.value;
    if (selectedList != null && selectedList.papers.length > 0) {
      this.watchlistCollectionService.createNewList(
        selectedList.name,
        selectedList.papers.map(x => ({
          symbol: x.symbol,
          exchange: x.exchange,
          instrumentGroup: x.board
        }))
      );

      this.presetListForm.reset();
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
