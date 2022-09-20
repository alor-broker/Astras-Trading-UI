import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Store } from '@ngrx/store';
import { NzOptionSelectionChange } from 'ng-zorro-antd/auto-complete';
import {
  BehaviorSubject,
  Observable,
  of,
  shareReplay,
  take
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
import { selectNewInstrumentByBadge } from '../../../../store/instruments/instruments.actions';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { InstrumentSelectSettings } from "../../../../shared/models/settings/instrument-select-settings.model";
import { WatchlistCollection } from '../../models/watchlist.model';

@Component({
  selector: 'ats-instrument-select[shouldShowSettings][guid]',
  templateUrl: './instrument-select.component.html',
  styleUrls: ['./instrument-select.component.less']
})
export class InstrumentSelectComponent implements OnInit {

  @ViewChild('inputEl') inputEl!: ElementRef;
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  filteredInstruments$: Observable<Instrument[]> = of([]);
  inputValue?: string;
  collection$?: Observable<WatchlistCollection>;
  settings$!: Observable<InstrumentSelectSettings>;
  private filter$: BehaviorSubject<SearchFilter | null> = new BehaviorSubject<SearchFilter | null>(null);

  constructor(
    private readonly service: InstrumentsService,
    private readonly store: Store,
    private readonly settingsService: WidgetSettingsService,
    private readonly watchlistCollectionService: WatchlistCollectionService) {

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
  }

  watch(instrument: InstrumentKey) {
    this.settings$.pipe(
      filter(({ activeListId }) => !!activeListId),
      take(1)
    ).subscribe(s => {
      this.watchlistCollectionService.addItemsToList(s.activeListId!, [instrument]);
      this.store.dispatch(selectNewInstrumentByBadge({ badgeColor: s.badgeColor!, instrument }));
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
}
