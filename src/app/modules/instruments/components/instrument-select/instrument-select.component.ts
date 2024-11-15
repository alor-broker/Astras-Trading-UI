import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import { NzOptionSelectionChange } from 'ng-zorro-antd/auto-complete';
import {
  BehaviorSubject,
  combineLatest,
  fromEvent,
  Observable,
  of,
  shareReplay,
  take,
} from 'rxjs';
import {
  debounceTime,
  filter,
  switchMap
} from 'rxjs/operators';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { SearchFilter } from '../../models/search-filter.model';
import { InstrumentsService } from '../../services/instruments.service';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WatchlistCollection } from '../../models/watchlist.model';
import { DOCUMENT } from '@angular/common';
import { InstrumentSelectSettings, WatchlistMeta } from '../../models/instrument-select-settings.model';
import { DomHelper } from "../../../../shared/utils/dom-helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WatchListTitleHelper } from "../../utils/watch-list-title.helper";
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from 'src/app/shared/services/actions-context';
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { WatchInstrumentsService } from "../../services/watch-instruments.service";

@Component({
  selector: 'ats-instrument-select',
  templateUrl: './instrument-select.component.html',
  styleUrls: ['./instrument-select.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstrumentSelectComponent implements OnInit {
  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;

  @Input({ required: true })
  guid!: string;

  autocompleteMinWidth = 250;
  filteredInstruments$: Observable<Instrument[]> = of([]);
  inputValue?: string;
  collection$!: Observable<WatchlistCollection>;
  settings$!: Observable<InstrumentSelectSettings>;
  getTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;
  private readonly filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);

  constructor(
    private readonly service: InstrumentsService,
    private readonly settingsService: WidgetSettingsService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly watchInstrumentsService: WatchInstrumentsService,
    @Inject(ACTIONS_CONTEXT)
    private readonly actionsContext: ActionsContext,
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly destroyRef: DestroyRef) {

  }

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
        this.inputEl.nativeElement.value = '';
        this.inputEl.nativeElement.blur();
      }, 0);
    }
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<InstrumentSelectSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.filteredInstruments$ = this.filter$.pipe(
      filter((f): f is SearchFilter => !!f),
      debounceTime(200),
      switchMap(filter => this.service.getInstruments(filter))
    );

    this.collection$ = this.watchlistCollectionService.getWatchlistCollection().pipe(
      shareReplay(1)
    );

    this.setDefaultWatchList();

    fromEvent<KeyboardEvent>(this.document.body, 'keydown').pipe(
      filter(() => !DomHelper.isModalOpen()),
      filter(e => e.ctrlKey && e.code === 'KeyF' && !e.cancelBubble),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((e) => {
      e.stopPropagation();
      e.preventDefault();
      this.inputEl.nativeElement.value = '';
      this.inputEl.nativeElement.select();
    });
  }

  watch(instrument: InstrumentKey): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      if ((settings.activeWatchlistMetas?.length ?? 0) === 0) {
        return;
      }

      this.watchlistCollectionService.addItemsToList(settings.activeWatchlistMetas![0].id, [instrument]);
      this.actionsContext.instrumentSelected(instrument, settings.badgeColor ?? defaultBadgeColor);
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
          this.watchInstrumentsService.unsubscribeFromList(listId);

          this.settingsService.updateSettings(
            this.guid,
            {
              activeWatchlistMetas: settings.activeWatchlistMetas?.filter((meta) => meta.id !== listId) ?? []
            }
          );
        } else {
          this.settingsService.updateSettings(
            this.guid,
            {
              activeWatchlistMetas: [{ id: listId, isExpanded: true }, ...(settings.activeWatchlistMetas ?? [])]
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

      const defaultList = collection.collection.find(x => x.isDefault);

      if (defaultList) {
        this.settingsService.updateSettings(this.guid, { activeWatchlistMetas: [{ id: defaultList.id, isExpanded: true }] });
      }
    });
  }
}
