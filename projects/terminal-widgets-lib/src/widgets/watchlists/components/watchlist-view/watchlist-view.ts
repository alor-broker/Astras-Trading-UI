import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnInit,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {WatchlistCollectionService} from "@terminal-core-lib/features/watchlist/services/watchlist-collection.service";
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {
  Instrument,
  InstrumentKey
} from '@terminal-core-lib/common/types/instrument.types';
import {WatchlistCollection} from '@terminal-core-lib/features/watchlist/types/watchlist.types';
import {
  WatchlistMeta,
  WatchlistsWidgetSettings
} from '@terminal-widgets-lib/widgets/watchlists/widget-settings.types';
import {WatchListTitleHelper} from "@terminal-core-lib/features/watchlist/utils/watchlist-title.hepler";
import {SearchFilter} from '@terminal-core-lib/features/instruments/services/instruments-service.types';
import {WatchlistService} from '@terminal-widgets-lib/widgets/watchlists/services/watchlist.service';
import {
  NzAutocompleteComponent,
  NzAutocompleteOptionComponent,
  NzAutocompleteTriggerDirective,
  NzOptionSelectionChange
} from 'ng-zorro-antd/auto-complete';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {AsyncPipe} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {FormsModule} from '@angular/forms';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  NzMenuDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {WatchlistTable} from '@terminal-widgets-lib/widgets/watchlists/components/watchlist-table/watchlist-table';

@Component({
  selector: 'ats-watchlist-view',
  imports: [
    AsyncPipe,
    TranslocoDirective,
    NzInputDirective,
    FormsModule,
    NzAutocompleteTriggerDirective,
    NzAutocompleteComponent,
    NzAutocompleteOptionComponent,
    NzTagComponent,
    NzButtonComponent,
    NzDropdownDirective,
    NzTooltipDirective,
    NzIconDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    WatchlistTable
  ],
  templateUrl: './watchlist-view.html',
  styleUrl: './watchlist-view.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistView implements OnInit {
  readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  readonly guid = input.required<string>();

  filteredInstruments$: Observable<Instrument[]> = of([]);

  inputValue?: string;

  collection$!: Observable<WatchlistCollection>;

  settings$!: Observable<WatchlistsWidgetSettings>;

  getTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;

  private readonly service = inject(InstrumentsService);

  private readonly settingsService = inject(WidgetSettingsService);

  private readonly watchlistCollectionService = inject(WatchlistCollectionService);

  private readonly watchlistService = inject(WatchlistService);

  private readonly actionsContext = inject(ACTIONS_CONTEXT);

  private readonly filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);

  onChange(value: string): void {
    const existing = this.filter$.getValue();
    let exchange = 'MOEX';
    let query = '';
    let instrumentGroup = '';
    let filter: SearchFilter;

    const isComplexSearch = value.includes(':');
    if (isComplexSearch) {
      const parts = value.split(':');
      exchange = parts[0].toUpperCase();
      query = parts[1];
      instrumentGroup = parts[2]?.toUpperCase() ?? '';
    }
    if (existing) {
      filter = {
        ...existing,
        query: isComplexSearch ? query : value,
        exchange: isComplexSearch ? exchange : '',
        instrumentGroup: isComplexSearch && instrumentGroup ? instrumentGroup : ''
      };
    } else {
      filter = {
        query: isComplexSearch ? query : value,
        exchange: isComplexSearch ? exchange : '',
        instrumentGroup: isComplexSearch && instrumentGroup ? instrumentGroup : '',
        limit: 20
      };
    }

    this.filter$.next(filter);
  }

  onSelect(event: NzOptionSelectionChange, val: Instrument): void {
    if (event.isUserInput) {
      this.watch(val);
      setTimeout(() => {
        this.inputEl().nativeElement.value = '';
        this.inputEl().nativeElement.blur();
      }, 0);
    }
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<WatchlistsWidgetSettings>(this.guid()).pipe(
      shareReplay(1)
    );

    this.filteredInstruments$ = this.filter$.pipe(
      filter((f): f is SearchFilter => !!f),
      debounceTime(200),
      switchMap(filter => this.service.searchInstruments(filter))
    );

    this.collection$ = this.watchlistCollectionService.getWatchlistCollection().pipe(
      shareReplay(1)
    );

    this.setDefaultWatchList();
  }

  watch(instrument: InstrumentKey): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      if ((settings.activeWatchlistMetas?.length ?? 0) === 0) {
        return;
      }

      this.watchlistCollectionService.addItemsToList(settings.activeWatchlistMetas![0].id, [instrument]);
      this.actionsContext.selectInstrument(instrument, settings.badgeColor ?? DefaultBadge);
    });
  }

  selectCollection(listId: string): void {
    this.settings$
      .pipe(
        take(1)
      )
      .subscribe(settings => {
        const isRemoveWatchlist = (settings.activeWatchlistMetas ?? [])
          .map(wm => wm.id)
          .includes(listId);

        if (isRemoveWatchlist) {
          this.watchlistService.unsubscribeFromList(listId);

          this.settingsService.updateSettings<WatchlistsWidgetSettings>(
            this.guid(),
            {
              activeWatchlistMetas: settings.activeWatchlistMetas?.filter((meta) => meta.id !== listId) ?? []
            }
          );
        } else {
          this.settingsService.updateSettings<WatchlistsWidgetSettings>(
            this.guid(),
            {
              activeWatchlistMetas: [{id: listId, isExpanded: true}, ...(settings.activeWatchlistMetas ?? [])]
            }
          );
        }
      });
  }

  isSelectedWatchlist(listId: string, activeLists: WatchlistMeta[]): boolean {
    return activeLists
      .map(l => l.id)
      .includes(listId);
  }

  getAutocompleteLeftPosition(): string {
    const autocompleteEl = document.querySelector('.instrument-select-autocomplete')?.parentElement;

    if (!autocompleteEl) {
      return '0px';
    }

    const autocompleteRect = autocompleteEl.getBoundingClientRect();

    return `${Math.min(window.innerWidth - autocompleteRect.right, 0)}px`;
  }

  getAutocompleteWidth(input: HTMLInputElement): number {
    const inputWidth = input.getBoundingClientRect().width;
    return Math.max(250, inputWidth);
  }

  private setDefaultWatchList(): void {
    combineLatest([
        this.settings$,
        this.collection$
      ]
    ).pipe(
      take(1)
    ).subscribe(([settings, collection]) => {
      if (settings.activeWatchlistMetas != null) {
        if (collection.collection.find(w => settings.activeWatchlistMetas!.map(wm => wm.id).includes(w.id))) {
          return;
        }
      }

      const defaultList = collection.collection.find(x => x.isDefault ?? false);

      if (defaultList) {
        this.settingsService.updateSettings<WatchlistsWidgetSettings>(this.guid(), {
          activeWatchlistMetas: [{
            id: defaultList.id,
            isExpanded: true
          }]
        });
      }
    });
  }
}
