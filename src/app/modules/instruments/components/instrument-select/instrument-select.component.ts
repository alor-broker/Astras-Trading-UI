import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { NzOptionSelectionChange } from 'ng-zorro-antd/auto-complete';
import {
  BehaviorSubject,
  fromEvent,
  Observable,
  of,
  shareReplay,
  Subject,
  take,
  takeUntil
} from 'rxjs';
import {
  debounceTime,
  filter,
  map,
  startWith,
  switchMap
} from 'rxjs/operators';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { SearchFilter } from '../../models/search-filter.model';
import { InstrumentsService } from '../../services/instruments.service';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {Watchlist, WatchlistCollection} from '../../models/watchlist.model';
import { DOCUMENT } from '@angular/common';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { InstrumentSelectSettings } from '../../models/instrument-select-settings.model';

@Component({
  selector: 'ats-instrument-select[guid]',
  templateUrl: './instrument-select.component.html',
  styleUrls: ['./instrument-select.component.less']
})
export class InstrumentSelectComponent implements OnInit, OnDestroy {
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;

  @Input()
  guid!: string;

  filteredInstruments$: Observable<Instrument[]> = of([]);
  inputValue?: string;
  collection$?: Observable<WatchlistCollection>;
  settings$!: Observable<InstrumentSelectSettings>;

  private filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);

  constructor(
    private readonly service: InstrumentsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly settingsService: WidgetSettingsService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    @Inject(DOCUMENT) private readonly document: Document) {

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
    }
    else {
      filter = {
        query: isComplexSearch ? query : value,
        exchange: isComplexSearch ? exchange : '',
        instrumentGroup: isComplexSearch && instrumentGroup ? instrumentGroup : '',
        limit: 20
      };
    }

    this.filter$.next(filter);
  }

  onSelect(event: NzOptionSelectionChange, val: Instrument) {
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

    this.setDefaultWatchList();

    this.collection$ = this.watchlistCollectionService.collectionChanged$.pipe(
      startWith(null),
      map(() => this.watchlistCollectionService.getWatchlistCollection()),
    );

    fromEvent<KeyboardEvent>(this.document.body, 'keydown').pipe(
      filter(e => e.ctrlKey && e.code === 'KeyF' && !e.cancelBubble),
      takeUntil(this.destroy$)
    ).subscribe((e) => {
      e.stopPropagation();
      e.preventDefault();
      this.inputEl.nativeElement.value = '';
      this.inputEl.nativeElement.select();
    });
  }

  watch(instrument: InstrumentKey) {
    this.settings$.pipe(
      filter(({ activeListId }) => !!activeListId),
      take(1)
    ).subscribe(s => {
      this.watchlistCollectionService.addItemsToList(s.activeListId!, [instrument]);
      this.dashboardContextService.selectDashboardInstrument(instrument, s.badgeColor!);
    });
  }

  selectCollection(listId: string) {
    this.settingsService.updateSettings(this.guid, { activeListId: listId });
  }

  private setDefaultWatchList() {
    this.settingsService.getSettings<InstrumentSelectSettings>(this.guid).pipe(
      take(1)
    ).subscribe(settings => {
      if (!!settings.activeListId) {
        return;
      }

      const collection = this.watchlistCollectionService.getWatchlistCollection();
      const defaultList = collection.collection.find(x => x.isDefault);
      if (defaultList) {
        this.settingsService.updateSettings(this.guid, { activeListId: defaultList.id });
      }
    });
  }

  hasDefaultTitle(list: Watchlist): boolean {
    return (list.isDefault ?? false)
      && list.title === WatchlistCollectionService.DefaultListName;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
