import {
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
  map,
  switchMap
} from 'rxjs/operators';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { SearchFilter } from '../../models/search-filter.model';
import { InstrumentsService } from '../../services/instruments.service';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  Watchlist,
  WatchlistCollection,
  WatchlistType
} from '../../models/watchlist.model';
import { DOCUMENT } from '@angular/common';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { InstrumentSelectSettings } from '../../models/instrument-select-settings.model';
import { DomHelper } from "../../../../shared/utils/dom-helper";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WatchListTitleHelper } from "../../utils/watch-list-title.helper";

@Component({
  selector: 'ats-instrument-select',
  templateUrl: './instrument-select.component.html',
  styleUrls: ['./instrument-select.component.less']
})
export class InstrumentSelectComponent implements OnInit {
  readonly watchlistTypes = WatchlistType;

  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;

  @Input({ required: true })
  guid!: string;

  filteredInstruments$: Observable<Instrument[]> = of([]);
  inputValue?: string;
  collection$!: Observable<WatchlistCollection>;
  settings$!: Observable<InstrumentSelectSettings>;
  currentWatchlist$!: Observable<Watchlist>;
  getTitleTranslationKey = WatchListTitleHelper.getTitleTranslationKey;
  private readonly filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);

  constructor(
    private readonly service: InstrumentsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly settingsService: WidgetSettingsService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
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

    this.currentWatchlist$ = combineLatest({
      settings: this.settings$,
      collection: this.collection$
    }).pipe(
      map(x => x.collection.collection.find(wl => wl.id === x.settings.activeListId)),
      filter((wl): wl is Watchlist => !!wl),
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
    combineLatest({
      watchlist: this.currentWatchlist$,
      settings: this.settings$
    }).pipe(
      take(1)
    ).subscribe(x => {
      this.watchlistCollectionService.addItemsToList(x.watchlist.id, [instrument]);
      this.dashboardContextService.selectDashboardInstrument(instrument, x.settings.badgeColor!);
    });
  }


  selectCollection(listId: string): void {
    this.settingsService.updateSettings(this.guid, { activeListId: listId });
  }

  private setDefaultWatchList(): void {
    combineLatest([
        this.settings$,
        this.collection$
      ]
    ).pipe(
      take(1)
    ).subscribe(([settings, collection]) => {
      if (!!(settings.activeListId ?? '')) {
        if (collection.collection.find(w => w.id === settings.activeListId)) {
          return;
        }
      }

      const defaultList = collection.collection.find(x => x.isDefault);
      if (defaultList) {
        this.settingsService.updateSettings(this.guid, { activeListId: defaultList.id });
      }
    });
  }
}
